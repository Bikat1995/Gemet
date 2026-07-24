# Gemet (ገምት)

Telegram Mini App for lowest-unique-bid auctions. The repository has a Next.js Telegram web app and a Fastify API backed by PostgreSQL and Redis.

## Start locally

1. Copy `.env.example` to `.env`, fill in real Telegram and Chapa secrets, then run `docker compose up -d`.
2. Run `npm install`, `npm run db:generate`, then `npm run dev`.
3. Apply the Prisma schema using `npm run prisma:migrate -w @gemet/api -- --name init`.

For Telegram production, configure the API URL as the bot Web App URL, serve both apps using TLS, and register the Chapa webhook at `/webhooks/chapa`.

## Telegram Mini App

1. Deploy the web app and API using public HTTPS URLs. Set `NEXT_PUBLIC_API_URL`, `API_URL`, `TMA_RETURN_URL`, and `TMA_URL` to those public URLs (not localhost).
2. Copy `TMA_URL` into `apps/api/.env`, then run `npm run telegram:configure`. This sets the bot's **Open Gemet** menu button and bot commands through Telegram's Bot API.
3. Open the bot in Telegram and tap **Open Gemet**. The app loads the Telegram WebApp SDK, verifies `initData` server-side, and then enables authenticated bidding and Chapa deposits.

## Security / money invariants

- Telegram `initData` is verified server-side before an API session is issued.
- Amounts use integer **cents** internally (ETB × 100), eliminating float errors.
- Bid charging and immutable bid creation are one PostgreSQL serializable transaction.
- Chapa webhook verification and `txRef` unique constraint make wallet credits idempotent.
- Redis uses a Lua script (single-thread atomic), which is safer and faster than client-side `WATCH/MULTI` for bid frequency and sorted-set updates.
