import crypto from 'node:crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { z } from 'zod';
import { AuctionStatus, BidStatus, TransactionStatus } from '@prisma/client';
import { prisma, redis, redisSub, verifyTelegramInitData, cents, etb } from './lib.js';
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
  const { category: cat, q } = req.query as any;
  const cacheKey = `auctions:${cat || 'all'}:${q || 'none'}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (_) { /* Redis down — fall through to DB */ }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const where: any = {
    status: AuctionStatus.active,
    endTime: { gt: twentyFourHoursAgo }
  };
  if (cat && cat !== 'All') where.category = cat;
  if (q) where.title = { contains: q, mode: 'insensitive' };

  const auctions = (await prisma.auction.findMany({ where, orderBy: { endTime: 'asc' } })).map(presentAuction);
  const result = { auctions };

  try { await redis.set(cacheKey, JSON.stringify(result), 'EX', 3); } catch (_) {}
  return result;
});
// Removed /wallet and /wallet/history
app.get('/bids/history', async req => {
  const s = await session(req);
  const bids = await prisma.bid.findMany({ where:{ userId: s.userId }, include: { auction: true }, orderBy: { createdAt: 'desc' } });
  return { bids: bids.map(b => ({ id: b.id, amount: b.amount != null ? etb(b.amount) : null, paymentStatus: b.paymentStatus, ticketNumber: b.ticketNumber, status: b.status, date: b.createdAt, auction: { title: b.auction.title, status: b.auction.status, imageUrl: b.auction.imageUrl } })) };
});
function maskPhone(p: string | null) {
  if (!p) return 'Unknown';
  if (p.length < 6) return p;
  const isIntl = p.startsWith('+251');
  const prefixLen = isIntl ? 7 : 4;
  const prefix = p.substring(0, prefixLen);
  const suffix = p.substring(p.length - 2);
  const maskedLength = p.length - prefixLen - 2;
  const masked = '*'.repeat(Math.max(0, maskedLength));
  return prefix + masked + suffix;
}

app.get('/winners', async () => {
  const winners = await prisma.auctionWinner.findMany({ include: { auction: true, user: true }, orderBy: { declaredAt: 'desc' } });
  return { winners: winners.map(w => ({ id: w.auctionId, title: w.auction.title, description: w.auction.description, category: w.auction.category, image: w.auction.imageUrl, winner: maskPhone(w.user.phoneNumber), amount: etb(w.winningBidAmount), date: w.declaredAt })) };
});

app.get('/auctions/:id/bidders', async (req, reply) => {
  const auctionId = (req.params as any).id;
  const bids = await prisma.bid.findMany({
    where: { auctionId, amount: { not: null }, paymentStatus: TransactionStatus.success },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  return {
    totalBids: bids.length,
    bidders: bids.map(b => ({
      id: b.id,
      phone: maskPhone(b.user.phoneNumber),
      date: b.createdAt
    }))
  };
});

app.get('/winners/:auctionId/losers', async (req) => {
  const auctionId = (req.params as any).auctionId;
  const winner = await prisma.auctionWinner.findUnique({ where: { auctionId } });
  const bids = await prisma.bid.findMany({
    where: { 
       auctionId, 
       amount: { not: null }, 
       paymentStatus: TransactionStatus.success,
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  
  const losers = winner 
    ? bids.filter(b => !(b.userId === winner.userId && b.amount === winner.winningBidAmount))
    : bids;

  return {
    losers: losers.map(b => ({
      id: b.id,
      ticketNumber: b.ticketNumber,
      phone: maskPhone(b.user.phoneNumber),
      amount: etb(b.amount!),
      date: b.createdAt
    }))
  };
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
  const ticket = await prisma.bid.findFirst({ where: { userId: s.userId, auctionId, amount: null }, orderBy: { createdAt: 'desc' } });
  
  return { ticket };
});

app.post('/auctions/:id/manual-pay/submit', async (req, reply) => {
  try {
    const s = await session(req);
    const auctionId = (req.params as any).id;
    const body = z.object({ txId: z.string().min(3), paymentMethod: z.string().min(2) }).parse(JSON.parse((req.body as Buffer).toString()));
    
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction || auction.status !== AuctionStatus.active) return reply.code(404).send({ error: 'Auction not found or not active' });

    const existingTicket = await prisma.bid.findFirst({ where: { userId: s.userId, auctionId, amount: null }, orderBy: { createdAt: 'desc' } });
    
    // Check if they already have a ticket that is paid
    if (existingTicket?.paymentStatus === TransactionStatus.success && existingTicket.amount == null) {
      return reply.code(400).send({ error: 'You already paid. Please submit your bid.' });
    }
    
    // Make sure txRef is not already used
    const existingTx = await prisma.bid.findUnique({ where: { txRef: body.txId } });
    if (existingTx && existingTx.id !== existingTicket?.id) {
      return reply.code(400).send({ error: 'Transaction ID already used.' });
    }

    if (existingTicket) {
      await prisma.bid.update({
        where: { id: existingTicket.id },
        data: {
          txRef: body.txId,
          paymentMethod: body.paymentMethod,
          paymentStatus: TransactionStatus.verifying
        }
      });
    } else {
      await prisma.bid.create({
        data: {
          userId: s.userId,
          auctionId,
          ticketNumber: `UND-${crypto.randomInt(1000, 999999)}`,
          txRef: body.txId,
          paymentMethod: body.paymentMethod,
          paymentStatus: TransactionStatus.verifying
        }
      });
    }
    
    return { success: true };
  } catch (err: any) {
    console.error('Manual Pay Submit Error:', err);
    return reply.code(400).send({ error: 'Failed to submit transaction.', details: err.message });
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
    
    // Send Telegram ticket notification
    try {
      const userRecord = await prisma.user.findUnique({ where: { id: s.userId } });
      if (userRecord?.telegramId) {
        const tmaUrl = process.env.TMA_URL ?? 'https://gemet.vercel.app';
        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: userRecord.telegramId.toString(),
            text: `🎫 *Bid Confirmed!*\n\n📦 Auction: *${auction.title}*\n🔖 Ticket: \`${bid.ticketNumber}\`\n💰 Your Bid: *${etb(amount)} ETB*\n\nGood luck! The lowest unique bid wins. 🏆`,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🎮 Open Gemet', web_app: { url: tmaUrl } }]] }
          })
        });
      }
    } catch (_) {}
    
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

app.get('/admin/payments/pending', async (req) => {
  const pending = await prisma.bid.findMany({
    where: { paymentStatus: TransactionStatus.verifying },
    include: { auction: true, user: true },
    orderBy: { createdAt: 'asc' }
  });
  return {
    payments: pending.map(p => ({
      id: p.id,
      username: p.user.username || 'Anonymous',
      phoneNumber: p.user.phoneNumber,
      auctionTitle: p.auction.title,
      entryFee: etb(p.auction.entryFee),
      paymentMethod: p.paymentMethod,
      txId: p.txRef,
      createdAt: p.createdAt
    }))
  };
});

app.post('/admin/payments/:id/verify', async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = z.object({ status: z.enum(['success', 'failed']) }).parse(JSON.parse((req.body as Buffer).toString()));
    
    const bid = await prisma.bid.update({
      where: { id },
      data: { paymentStatus: status as TransactionStatus },
      include: { auction: true }
    });
    
    if (status === 'success') {
      await prisma.notification.create({ data: { userId: bid.userId, title: 'Payment Approved', message: `Your payment for ${bid.auction.title} was approved! You can now place your bid.` }});
    } else {
      await prisma.notification.create({ data: { userId: bid.userId, title: 'Payment Rejected', message: `Your transaction ID for ${bid.auction.title} was invalid. Please try again.` }});
    }
    
    return { success: true };
  } catch (e: any) {
    return reply.code(400).send({ error: 'Verification failed' });
  }
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

app.get('/admin/bids', async () => {
  const bids = await prisma.bid.findMany({
    where: { amount: { not: null } },
    include: { auction: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 500
  });
  return {
    bids: bids.map(b => ({
      id: b.id,
      auctionTitle: b.auction.title,
      auctionCategory: b.auction.category,
      username: b.user.username || 'Anonymous',
      phoneNumber: b.user.phoneNumber || 'Not provided',
      ticketNumber: b.ticketNumber,
      amount: etb(b.amount!),
      status: b.status,
      date: b.createdAt
    }))
  };
});
app.get('/admin/winners', async () => {
  const winners = await prisma.auctionWinner.findMany({ include: { auction: true, user: true }, orderBy: { declaredAt: 'desc' } });
  return { winners: winners.map(w => ({
    auctionId: w.auctionId,
    title: w.auction.title,
    description: w.auction.description,
    category: w.auction.category,
    username: w.user.username || 'Anonymous',
    phoneNumber: w.user.phoneNumber || 'Not provided',
    winningBidAmount: etb(w.winningBidAmount),
    date: w.declaredAt
  })) };
});

app.get('/admin/live-leaders', async () => {
  // For every active auction, find the current lowest-unique bid
  const activeAuctions = await prisma.auction.findMany({
    where: { status: AuctionStatus.active },
    orderBy: { endTime: 'asc' },
  });

  const leaders = await Promise.all(activeAuctions.map(async (auction) => {
    // Get all placed bids grouped by amount
    const bids = await prisma.bid.findMany({
      where: { auctionId: auction.id, amount: { not: null }, paymentStatus: TransactionStatus.success },
      include: { user: true },
      orderBy: { amount: 'asc' },
    });

    // Count frequency of each amount
    const freq: Record<number, number> = {};
    for (const b of bids) { if (b.amount != null) freq[b.amount] = (freq[b.amount] ?? 0) + 1; }

    // Find lowest unique amount
    const unique = bids.filter(b => b.amount != null && freq[b.amount!] === 1);
    const currentLeader = unique.length > 0 ? unique[0] : null;

    return {
      auctionId: auction.id,
      auctionTitle: auction.title,
      category: auction.category,
      endTime: auction.endTime,
      totalBids: bids.length,
      currentLeader: currentLeader ? {
        username: currentLeader.user.username || 'Anonymous',
        phoneNumber: currentLeader.user.phoneNumber || 'Not provided',
        amount: etb(currentLeader.amount!),
        ticketNumber: currentLeader.ticketNumber,
      } : null,
    };
  }));

  return { leaders };
});
app.get('/admin/auctions', async () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const auctions = await prisma.auction.findMany({
    where: {
      OR: [
        { status: AuctionStatus.active },
        { status: AuctionStatus.ended, endTime: { gt: oneDayAgo } }
      ]
    },
    orderBy: { startTime: 'desc' }
  });
  return { auctions: auctions.map(presentAuction) };
});
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
    // Delete related bids and winner first to avoid FK constraint errors
    await prisma.bid.deleteMany({ where: { auctionId: id } });
    await prisma.auctionWinner.deleteMany({ where: { auctionId: id } });
    await prisma.auction.delete({ where: { id } });
    return { success: true };
  } catch (err) {
    return reply.code(500).send({ error: 'Failed to delete auction' });
  }
});

// DANGER: wipe everything - protected by a secret key
app.post('/admin/reset-all', async (req, reply) => {
  try {
    const bodyStr = Buffer.isBuffer(req.body) ? (req.body as Buffer).toString() : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    const { secret } = JSON.parse(bodyStr);
    const expected = process.env.ADMIN_RESET_SECRET ?? 'Bike_Tile_Asse';
    if (!secret || secret !== expected) {
      return reply.code(403).send({ error: 'Forbidden: wrong secret' });
    }
    await prisma.notification.deleteMany();
    await prisma.auctionWinner.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.auction.deleteMany();
    await prisma.user.deleteMany();
    return { success: true, message: 'All data cleared' };
  } catch (e: any) {
    return reply.code(400).send({ error: 'Bad request', details: e.message });
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

// Auto-close auctions that have ended
setInterval(async () => {
  try {
    const endedAuctions = await prisma.auction.findMany({ where: { status: AuctionStatus.active, endTime: { lte: new Date() } } });
    for (const a of endedAuctions) {
      console.log(`Auto-closing auction ${a.id}...`);
      await closeAuction(a.id).catch(err => console.error(`Failed to close auction ${a.id}:`, err));
    }
  } catch (err) {
    console.error('Auto-close cron error:', err);
  }
}, 10000); // Check every 10 seconds

app.listen({ port:Number(process.env.PORT ?? 4000), host:'0.0.0.0' });
