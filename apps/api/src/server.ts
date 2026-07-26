import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { z } from 'zod';
import { AuctionStatus, BidStatus, TransactionStatus, TransactionType } from '@prisma/client';
import { prisma, redisSub, verifyTelegramInitData, validChapaSignature, cents, etb } from './lib.js';
import { lowestUnique, registerBid } from './luba.js';

const app = Fastify({ logger: true, bodyLimit: 20971520 });
await app.register(cors, { origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'] });
await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'development-only-change-me' });
await app.register(websocket);
app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => done(null, body));

type Session = { userId: string; telegramId: string };
async function session(req: any): Promise<Session> { await req.jwtVerify(); return req.user as Session; }
function presentAuction(a: any) { return { ...a, entryFee: etb(a.entryFee), startTime: a.startTime, endTime: a.endTime }; }

app.post('/auth/telegram', async (req, reply) => {
  const body = z.object({ initData: z.string() }).parse(JSON.parse((req.body as Buffer).toString()));
  let telegram = verifyTelegramInitData(body.initData, process.env.BOT_TOKEN!);
  if (!telegram && process.env.ADMIN_BOT_TOKEN) {
    telegram = verifyTelegramInitData(body.initData, process.env.ADMIN_BOT_TOKEN);
  }
  if (!telegram) return reply.code(401).send({ error: 'Invalid Telegram initData' });
  const user = await prisma.user.upsert({ where: { telegramId: BigInt(telegram.id) }, update: { username: telegram.username }, create: { telegramId: BigInt(telegram.id), username: telegram.username } });
  return { token: app.jwt.sign({ userId: user.id, telegramId: String(user.telegramId) }), user: { id:user.id, username:user.username, phoneNumber:user.phoneNumber } };
});

app.get('/health', async () => ({ ok: true, service: 'gemet-api' }));

app.get('/auctions', async (req) => {
  const cat = (req.query as any).category;
  const where = { status: AuctionStatus.active, ...(cat && cat !== 'All' ? { category: cat } : {}) };
  return { auctions: (await prisma.auction.findMany({ where, orderBy:{ endTime:'asc' } })).map(presentAuction) };
});
// Removed /wallet and /wallet/history
app.get('/bids/history', async req => {
  const s = await session(req);
  const bids = await prisma.bid.findMany({ where:{ userId: s.userId, amount: { not: null } }, include: { auction: true }, orderBy: { createdAt: 'desc' } });
  return { bids: bids.map(b => ({ id: b.id, amount: b.amount != null ? etb(b.amount) : null, ticketNumber: b.ticketNumber, status: b.status, date: b.createdAt, auction: { title: b.auction.title, status: b.auction.status, imageUrl: b.auction.imageUrl } })) };
});
app.get('/winners', async () => {
  const winners = await prisma.auctionWinner.findMany({ include: { auction: true, user: true }, orderBy: { declaredAt: 'desc' } });
  return { winners: winners.map(w => ({ id: w.auctionId, title: w.auction.title, image: w.auction.imageUrl, winner: w.user.username ?? 'Anonymous', amount: etb(w.winningBidAmount), date: w.declaredAt })) };
});
app.get('/notifications', async req => {
  const s = await session(req);
  return { notifications: await prisma.notification.findMany({ where: { userId: s.userId }, orderBy: { createdAt: 'desc' } }) };
});
app.post('/notifications/read', async req => {
  const s = await session(req);
  await prisma.notification.updateMany({ where: { userId: s.userId, read: false }, data: { read: true } });
  return { success: true };
});

app.get('/auctions/:id/ticket', async (req) => {
  const s = await session(req);
  const auctionId = (req.params as any).id;
  const ticket = await prisma.bid.findFirst({ where: { userId: s.userId, auctionId }, orderBy: { createdAt: 'desc' } });
  return { ticket };
});

app.post('/auctions/:id/pay', async (req, reply) => {
  try {
    const s = await session(req);
    const auctionId = (req.params as any).id;
    
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction || auction.status !== AuctionStatus.active) return reply.code(404).send({ error: 'Auction not found or not active' });
    
    const existingTicket = await prisma.bid.findFirst({ where: { userId: s.userId, auctionId }, orderBy: { createdAt: 'desc' } });
    if (existingTicket?.paymentStatus === TransactionStatus.success && existingTicket.amount == null) {
      return reply.code(400).send({ error: 'You already paid. Please submit your bid.' });
    }

    const txRef = `gemet-${crypto.randomUUID()}`;
    
    await prisma.bid.create({
      data: {
        userId: s.userId,
        auctionId,
        txRef,
        paymentStatus: TransactionStatus.pending
      }
    });

    const tmaUrl = process.env.TMA_URL ?? 'https://gemet.vercel.app';
    const returnUrl = `${tmaUrl}/auction/${auctionId}`;
    
    const res = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: etb(auction.entryFee),
        currency: 'ETB',
        tx_ref: txRef,
        callback_url: `${process.env.API_URL}/webhooks/chapa`,
        return_url: returnUrl
      })
    });
    
    const rawText = await res.text();
    let payload: any;
    try {
      payload = JSON.parse(rawText);
    } catch (e) {
      console.error('Chapa non-JSON response:', rawText);
      return reply.code(502).send({ error: 'Payment provider error', details: rawText });
    }
    
    if (!res.ok) {
      console.error('Chapa Error:', payload);
      return reply.code(502).send({ error: 'Payment provider unavailable', details: payload });
    }
    
    return { txRef, checkoutUrl: payload.data?.checkout_url };
  } catch (err: any) {
    console.error('Pay Endpoint Error:', err);
    return reply.code(500).send({ error: 'Internal Server Error', details: err.message });
  }
});

app.post('/bids', async (req, reply) => {
  const s = await session(req);
  const input = z.object({ auctionId: z.string(), amount: z.coerce.number().positive().max(1_000_000) }).parse(JSON.parse((req.body as Buffer).toString()));
  const amount = cents(input.amount);
  const auction = await prisma.auction.findUnique({ where: { id: input.auctionId } });
  if (!auction || auction.status !== AuctionStatus.active || auction.startTime > new Date() || auction.endTime <= new Date()) return reply.code(409).send({ error: 'Auction is not accepting bids' });
  
  try {
    const bid = await prisma.$transaction(async tx => {
      // Find the user's paid ticket that doesn't have an amount yet
      const ticket = await tx.bid.findFirst({ where: { userId: s.userId, auctionId: auction.id, paymentStatus: TransactionStatus.success, amount: null } });
      if (!ticket) throw new Error('NO_TICKET');
      
      return tx.bid.update({
        where: { id: ticket.id },
        data: { amount, status: BidStatus.created }
      });
    }, { isolationLevel: 'Serializable' });
    
    const state = await registerBid(auction.id, amount);
    await prisma.bid.updateMany({ where: { auctionId: auction.id, amount }, data: { status: state.unique ? BidStatus.unique : BidStatus.duplicated, calculatedAt: new Date() } });
    
    return { id: bid.id, ticketNumber: bid.ticketNumber, amount: etb(amount), unique: state.unique, frequency: state.frequency };
  } catch (e: any) {
    return reply.code(e.message === 'NO_TICKET' ? 402 : 409).send({ error: e.message === 'NO_TICKET' ? 'You must pay the entry fee first' : 'Could not place bid; retry safely' });
  }
});

app.post('/webhooks/telegram', async (req, reply) => {
  const update: any = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : (typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const tmaUrl = process.env.TMA_URL ?? 'https://gemet.vercel.app';

    const openAppButton = {
      inline_keyboard: [[{ text: '🎮 Open Gemet', web_app: { url: tmaUrl } }]]
    };

    if (msg.text === '/start') {
      const existingUser = await prisma.user.findUnique({ where: { telegramId: BigInt(msg.from.id) } });
      if (existingUser && existingUser.phoneNumber) {
        // Already registered — just show the open button
        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `Welcome back to Gemet, ${existingUser.username || 'there'}! 🏆\n\nTap below to open the app.`,
            reply_markup: openAppButton
          })
        });
      } else {
        // New user — ask for phone number only, no app button
        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: 'Welcome to Gemet! 🏆\n\nGemet is the premier unique-bid auction platform where you can win exclusive items for a fraction of their price!\n\nTo start bidding, please register by sharing your phone number.',
            reply_markup: { keyboard: [[{ text: '📱 Share Phone Number', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true }
          })
        });
      }
    } else if (msg.contact) {
      // User shared their phone — save it
      const phone = msg.contact.phone_number;
      await prisma.user.upsert({
        where: { telegramId: BigInt(msg.from.id) },
        update: { phoneNumber: phone, username: msg.from.username },
        create: { telegramId: BigInt(msg.from.id), username: msg.from.username, phoneNumber: phone }
      });
      // Remove the keyboard, then send the Open App button
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: 'Registration complete! 🎉', reply_markup: { remove_keyboard: true } })
      });
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'You can now open Gemet and start bidding!',
          reply_markup: openAppButton
        })
      });
    } else if (msg.text) {
      // Any other text — check registration status
      const existingUser = await prisma.user.findUnique({ where: { telegramId: BigInt(msg.from.id) } });
      if (existingUser && existingUser.phoneNumber) {
        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: 'Tap below to open Gemet.', reply_markup: openAppButton })
        });
      } else {
        // Not registered — re-prompt for phone number
        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: 'Please share your phone number first to access Gemet. 👇',
            reply_markup: { keyboard: [[{ text: '📱 Share Phone Number', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true }
          })
        });
      }
    }
  }
  return { success: true };
});

app.post('/webhooks/telegram-admin', async (req, reply) => {
  const update: any = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : (typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    // Strict restriction to Bikat's Telegram ID
    if (msg.from.id !== 7946038443) {
      await fetch(`https://api.telegram.org/bot${process.env.ADMIN_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: 'Unauthorized. You are not allowed to use this bot.' })
      });
      return { success: true };
    }
    
    if (msg.text === '/start') {
      await fetch(`https://api.telegram.org/bot${process.env.ADMIN_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'Welcome back, Boss! 🔐\n\nTap the button below to open the secure Admin Dashboard.',
          reply_markup: { inline_keyboard: [[{ text: '⚙️ Open Admin Dashboard', web_app: { url: `${process.env.TMA_URL ?? 'https://gemet.vercel.app'}/admin` } }]] }
        })
      });
    }
  }
  return { success: true };
});

app.post('/webhooks/chapa', async (req, reply) => {
  const raw = (req.body as Buffer).toString();
  if (!validChapaSignature(raw, req.headers['x-chapa-signature'] as string)) return reply.code(401).send({error:'Invalid signature'});
  const event:any = JSON.parse(raw); const txRef = event.tx_ref ?? event.data?.tx_ref; const success = (event.status ?? event.data?.status) === 'success';
  if (!txRef || !success) return { received:true };
  
  await prisma.$transaction(async tx => {
    const ticket = await tx.bid.findUnique({where:{txRef}}); 
    if (!ticket || ticket.paymentStatus === TransactionStatus.success) return;
    
    await tx.bid.update({where:{id:ticket.id},data:{paymentStatus:TransactionStatus.success}});
    const auction = await tx.auction.findUnique({where:{id:ticket.auctionId}});
    await tx.notification.create({data:{userId:ticket.userId,title:'Payment Successful',message:`You have successfully paid the entry fee for ${auction?.title ?? 'the auction'}. You can now place your bid!`}});
  }, { isolationLevel:'Serializable' });
  return { received:true };
});

app.get('/tickets/all', async (req) => {
  const auctions = await prisma.auction.findMany({
    orderBy: { endTime: 'asc' },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      bids: {
        where: { paymentStatus: TransactionStatus.success },
        select: {
          ticketNumber: true,
          status: true,
          createdAt: true,
          user: { select: { username: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  return { auctions };
});

app.get('/events/:auctionId', { websocket:true }, (socket, req) => {
  const auctionId = (req.params as {auctionId:string}).auctionId; const channel = `auction:${auctionId}:events`;
  const handler = (c:string, message:string) => { if (c === channel && socket.readyState === socket.OPEN) socket.send(message); };
  redisSub.subscribe(channel); redisSub.on('message', handler);
  socket.on('close', () => { redisSub.off('message', handler); redisSub.unsubscribe(channel); });
});

app.get('/admin/stats', async () => {
  const users = await prisma.user.count();
  const auctions = await prisma.auction.count({ where: { status: AuctionStatus.active } });
  
  // Calculate total revenue from tickets
  const tickets = await prisma.bid.findMany({ 
    where: { paymentStatus: TransactionStatus.success },
    include: { auction: { select: { entryFee: true } } }
  });
  const totalRevenueCents = tickets.reduce((acc, t) => acc + (t.auction?.entryFee || 0), 0);
  
  const bids = await prisma.bid.count({ where: { amount: { not: null } } });
  return { users, liveAuctions: auctions, totalDeposits: etb(totalRevenueCents), totalBids: bids };
});
app.get('/admin/users', async () => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return { users: users.map(u => ({ ...u, telegramId: String(u.telegramId) })) };
});
app.get('/admin/winners', async () => {
  const winners = await prisma.auctionWinner.findMany({ include: { auction: true, user: true }, orderBy: { declaredAt: 'desc' } });
  return { winners: winners.map(w => ({
    auctionId: w.auctionId,
    title: w.auction.title,
    username: w.user.username || 'Anonymous',
    phoneNumber: w.user.phoneNumber || 'Not provided',
    winningBidAmount: etb(w.winningBidAmount),
    date: w.declaredAt
  })) };
});
app.get('/admin/auctions', async () => ({ auctions: (await prisma.auction.findMany({ orderBy: { startTime: 'desc' } })).map(presentAuction) }));
app.post('/admin/auctions', async (req, reply) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(5),
    imageUrl: z.string().min(1),
    category: z.string().min(2),
    entryFee: z.coerce.number().positive(), // in ETB
    endTime: z.string().datetime(),
  });
  let bodyData;
  try {
    bodyData = JSON.parse((req.body as Buffer).toString());
  } catch (err) {
    return reply.code(400).send({ error: 'Invalid JSON' });
  }
  const data = schema.parse(bodyData);
  const auction = await prisma.auction.create({
    data: {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      category: data.category,
      entryFee: cents(data.entryFee),
      startTime: new Date(),
      endTime: new Date(data.endTime),
      status: AuctionStatus.active,
    }
  });
  return { success: true, auction: presentAuction(auction) };
});

app.delete('/admin/auctions/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    await prisma.auction.delete({ where: { id } });
    return { success: true };
  } catch (err) {
    return reply.code(500).send({ error: 'Failed to delete auction' });
  }
});

// Intended for a cron worker every minute. First writer wins due to AuctionWinner.auctionId being primary key.
export async function closeAuction(auctionId:string) {
  const auction = await prisma.auction.findUniqueOrThrow({where:{id:auctionId}}); if (auction.endTime > new Date()) throw new Error('Auction has not ended');
  const winningAmount = await lowestUnique(auctionId); await prisma.auction.update({where:{id:auctionId},data:{status:AuctionStatus.ended}});
  if (winningAmount === null) return null;
  const bid = await prisma.bid.findFirstOrThrow({where:{auctionId,amount:winningAmount},orderBy:{createdAt:'asc'}});
  const winner = await prisma.auctionWinner.upsert({where:{auctionId},update:{},create:{auctionId,userId:bid.userId,winningBidAmount:winningAmount}});
  await prisma.notification.create({data:{userId:bid.userId,title:'Auction Won!',message:`You won “${auction.title}” with ${etb(winningAmount)} ETB.`}});
  // Fire-and-forget is intentional: notification failure can never roll back a declared result.
  const user = await prisma.user.findUniqueOrThrow({where:{id:bid.userId}});
  if (process.env.BOT_TOKEN) fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:String(user.telegramId),text:`🏆 Congratulations! You won “${auction.title}” with the lowest unique bid of ${etb(winningAmount)} ETB.`})}).catch(err => app.log.error(err, 'winner notification failed'));
  return winner;
}

app.listen({ port:Number(process.env.PORT ?? 4000), host:'0.0.0.0' });
