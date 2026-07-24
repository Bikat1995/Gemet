-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('active', 'ended', 'scheduled', 'cancelled');
CREATE TYPE "BidStatus" AS ENUM ('created', 'duplicated', 'unique', 'invalid');
CREATE TYPE "TransactionType" AS ENUM ('deposit', 'bid_fee');
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateTable
CREATE TABLE "User" ("id" TEXT NOT NULL, "telegram_id" BIGINT NOT NULL, "username" TEXT, "wallet_balance" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Auction" ("id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "image_url" TEXT NOT NULL, "entry_fee" INTEGER NOT NULL, "start_time" TIMESTAMP(3) NOT NULL, "end_time" TIMESTAMP(3) NOT NULL, "status" "AuctionStatus" NOT NULL DEFAULT 'scheduled', CONSTRAINT "Auction_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Bid" ("id" TEXT NOT NULL, "auction_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "amount" INTEGER NOT NULL, "status" "BidStatus" NOT NULL DEFAULT 'created', "calculated_at" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Bid_pkey" PRIMARY KEY ("id"));
CREATE TABLE "WalletTransaction" ("id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "amount" INTEGER NOT NULL, "type" "TransactionType" NOT NULL, "tx_ref" TEXT, "status" "TransactionStatus" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id"));
CREATE TABLE "AuctionWinner" ("auction_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "winning_bid_amount" INTEGER NOT NULL, "declaredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AuctionWinner_pkey" PRIMARY KEY ("auction_id"));

CREATE UNIQUE INDEX "User_telegram_id_key" ON "User"("telegram_id");
CREATE INDEX "Bid_auction_id_amount_idx" ON "Bid"("auction_id", "amount");
CREATE UNIQUE INDEX "WalletTransaction_tx_ref_key" ON "WalletTransaction"("tx_ref");
CREATE INDEX "WalletTransaction_user_id_createdAt_idx" ON "WalletTransaction"("user_id", "createdAt");

ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuctionWinner" ADD CONSTRAINT "AuctionWinner_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuctionWinner" ADD CONSTRAINT "AuctionWinner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
