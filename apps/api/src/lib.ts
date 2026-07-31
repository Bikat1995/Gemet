import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

export const prisma = new PrismaClient();
export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
export const redisSub = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
export const cents = (value: string | number) => Math.round(Number(value) * 100);
export const etb = (value: number) => String(Math.round(value / 100));

/** Telegram's official data-check-string HMAC flow. Never trust client-provided user data. */
export function verifyTelegramInitData(initData: string, botToken = process.env.BOT_TOKEN!) {
  const params = new URLSearchParams(initData); const hash = params.get('hash');
  if (!hash || !botToken) return null;
  params.delete('hash');
  const data = [...params.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) return null;
  const authDate = Number(params.get('auth_date')); if (!authDate || Date.now() / 1000 - authDate > 86400) return null;
  const raw = params.get('user'); return raw ? JSON.parse(raw) as { id:number; username?:string } : null;
}
export function validChapaSignature(raw: string, signature?: string) {
  const secret = process.env.CHAPA_WEBHOOK_SECRET; if (!secret || !signature) return false;
  const digest = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
