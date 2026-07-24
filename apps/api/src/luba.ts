import { redis } from './lib.js';

// Redis executes Lua atomically: increments frequency, stores a sortable member, and publishes status changes.
const BID_LUA = `
local freq = redis.call('HINCRBY', KEYS[1], ARGV[1], 1)
redis.call('ZADD', KEYS[2], tonumber(ARGV[1]), ARGV[1])
local event = cjson.encode({auctionId=ARGV[2], amount=ARGV[1], frequency=freq, state=(freq == 1 and 'unique' or 'duplicated')})
redis.call('PUBLISH', KEYS[3], event)
return freq
`;
export async function registerBid(auctionId: string, amountCents: number) {
  const key = String(amountCents);
  const frequency = await redis.eval(BID_LUA, 3, `auction:${auctionId}:freq`, `auction:${auctionId}:amounts`, `auction:${auctionId}:events`, key, auctionId) as number;
  return { frequency, unique: frequency === 1 };
}
export async function lowestUnique(auctionId: string) {
  const amounts = await redis.zrange(`auction:${auctionId}:amounts`, 0, -1);
  for (const amount of amounts) if (await redis.hget(`auction:${auctionId}:freq`, amount) === '1') return Number(amount);
  return null;
}
