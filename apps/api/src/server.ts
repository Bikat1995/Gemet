import crypto from 'node:crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { z } from 'zod';
import { AuctionStatus, BidStatus, TransactionStatus, TransactionType } from '@prisma/client';
import { prisma, redisSub, verifyTelegramInitData, validChapaSignature, cents, etb } from './lib.js';
import { lowestUnique, registerBid } from './luba.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'development-only-change-me' });
await app.register(websocket);
app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => done(null, body));

type Session = { userId: string; telegramId: string };
async function session(req: any): Promise<Session> { await req.jwtVerify(); return req.user as Session; }
function presentAuction(a: any) { return { ...a, entryFee: etb(a.entryFee), startTime: a.startTime, endTime: a.endTime }; }

app.post('/auth/telegram', async (req, reply) => {
  const body = z.object({ initData: z.string() }).parse(JSON.parse((req.body as Buffer).toString()));
  const telegram = verifyTelegramInitData(body.initData); if (!telegram) return reply.code(401).send({ error: 'Invalid Telegram initData' });
  const user = await prisma.user.upsert({ where: { telegramId: BigInt(telegram.id) }, update: { username: telegram.username }, create: { telegramId: BigInt(telegram.id), username: telegram.username } });
  return { token: app.jwt.sign({ userId: user.id, telegramId: String(user.telegramId) }), user: { id:user.id, username:user.username, balance:etb(user.walletBalance) } };
});

app.get('/health', async () => ({ ok: true, service: 'gemet-api' }));

app.get('/auctions', async () => ({ auctions: (await prisma.auction.findMany({ where:{ status:AuctionStatus.active }, orderBy:{ endTime:'asc' } })).map(presentAuction) }));
app.get('/wallet', async req => { const s = await session(req); const u = await prisma.user.findUniqueOrThrow({where:{id:s.userId}}); return { balance:etb(u.walletBalance) }; });

app.post('/bids', async (req, reply) => {
  const s = await session(req); const input = z.object({ auctionId:z.string(), amount:z.coerce.number().positive().max(1_000_000) }).parse(JSON.parse((req.body as Buffer).toString()));
  const amount = cents(input.amount);
  const auction = await prisma.auction.findUnique({ where:{id:input.auctionId} });
  if (!auction || auction.status !== AuctionStatus.active || auction.startTime > new Date() || auction.endTime <= new Date()) return reply.code(409).send({ error:'Auction is not accepting bids' });
  try {
    // Serialisable wallet debit and immutable bid record. The fee is deliberately never refunded.
    const bid = await prisma.$transaction(async tx => {
      const user = await tx.user.findUniqueOrThrow({where:{id:s.userId}});
      if (user.walletBalance < auction.entryFee) throw new Error('INSUFFICIENT_FUNDS');
      await tx.user.update({where:{id:s.userId},data:{walletBalance:{decrement:auction.entryFee}}});
      await tx.walletTransaction.create({data:{userId:s.userId,amount:-auction.entryFee,type:TransactionType.bid_fee,status:TransactionStatus.success}});
      return tx.bid.create({data:{auctionId:auction.id,userId:s.userId,amount,status:BidStatus.created}});
    }, { isolationLevel:'Serializable' });
    const state = await registerBid(auction.id, amount);
    // A second matching bid invalidates every matching bid, including the original.
    await prisma.bid.updateMany({where:{auctionId:auction.id,amount},data:{status:state.unique ? BidStatus.unique : BidStatus.duplicated, calculatedAt:new Date()}});
    return { id:bid.id, amount:etb(amount), unique:state.unique, frequency:state.frequency, fee:etb(auction.entryFee) };
  } catch (e: any) { return reply.code(e.message === 'INSUFFICIENT_FUNDS' ? 402 : 409).send({error:e.message === 'INSUFFICIENT_FUNDS' ? 'Insufficient wallet balance' : 'Could not place bid; retry safely'}); }
});

app.post('/payments/initialize', async (req, reply) => {
  const s = await session(req); const input = z.object({ amount:z.coerce.number().positive() }).parse(JSON.parse((req.body as Buffer).toString()));
  const amount = cents(input.amount); const txRef = `gemet-${crypto.randomUUID()}`;
  await prisma.walletTransaction.create({data:{userId:s.userId,amount,type:TransactionType.deposit,status:TransactionStatus.pending,txRef}});
  const res = await fetch('https://api.chapa.co/v1/transaction/initialize', {method:'POST',headers:{Authorization:`Bearer ${process.env.CHAPA_SECRET_KEY}`, 'Content-Type':'application/json'},body:JSON.stringify({amount:etb(amount),currency:'ETB',tx_ref:txRef,callback_url:`${process.env.API_URL}/webhooks/chapa`,return_url:process.env.TMA_RETURN_URL})});
  const payload:any = await res.json(); if (!res.ok) return reply.code(502).send({error:'Payment provider unavailable'});
  return { txRef, checkoutUrl:payload.data?.checkout_url };
});

app.post('/webhooks/chapa', async (req, reply) => {
  const raw = (req.body as Buffer).toString();
  if (!validChapaSignature(raw, req.headers['x-chapa-signature'] as string)) return reply.code(401).send({error:'Invalid signature'});
  const event:any = JSON.parse(raw); const txRef = event.tx_ref ?? event.data?.tx_ref; const success = (event.status ?? event.data?.status) === 'success';
  if (!txRef || !success) return { received:true };
  // Unique txRef plus status predicate means webhook retries cannot double-credit a wallet.
  await prisma.$transaction(async tx => {
    const payment = await tx.walletTransaction.findUnique({where:{txRef}}); if (!payment || payment.status === TransactionStatus.success) return;
    await tx.walletTransaction.update({where:{id:payment.id},data:{status:TransactionStatus.success}});
    await tx.user.update({where:{id:payment.userId},data:{walletBalance:{increment:payment.amount}}});
  }, { isolationLevel:'Serializable' });
  return { received:true };
});

app.get('/events/:auctionId', { websocket:true }, (socket, req) => {
  const auctionId = (req.params as {auctionId:string}).auctionId; const channel = `auction:${auctionId}:events`;
  const handler = (c:string, message:string) => { if (c === channel && socket.readyState === socket.OPEN) socket.send(message); };
  redisSub.subscribe(channel); redisSub.on('message', handler);
  socket.on('close', () => { redisSub.off('message', handler); redisSub.unsubscribe(channel); });
});

// Intended for a cron worker every minute. First writer wins due to AuctionWinner.auctionId being primary key.
export async function closeAuction(auctionId:string) {
  const auction = await prisma.auction.findUniqueOrThrow({where:{id:auctionId}}); if (auction.endTime > new Date()) throw new Error('Auction has not ended');
  const winningAmount = await lowestUnique(auctionId); await prisma.auction.update({where:{id:auctionId},data:{status:AuctionStatus.ended}});
  if (winningAmount === null) return null;
  const bid = await prisma.bid.findFirstOrThrow({where:{auctionId,amount:winningAmount},orderBy:{createdAt:'asc'}});
  const winner = await prisma.auctionWinner.upsert({where:{auctionId},update:{},create:{auctionId,userId:bid.userId,winningBidAmount:winningAmount}});
  // Fire-and-forget is intentional: notification failure can never roll back a declared result.
  const user = await prisma.user.findUniqueOrThrow({where:{id:bid.userId}});
  if (process.env.BOT_TOKEN) fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:String(user.telegramId),text:`🏆 Congratulations! You won “${auction.title}” with the lowest unique bid of ${etb(winningAmount)} ETB.`})}).catch(err => app.log.error(err, 'winner notification failed'));
  return winner;
}

app.listen({ port:Number(process.env.PORT ?? 4000), host:'0.0.0.0' });
