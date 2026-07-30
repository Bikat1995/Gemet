-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'verifying';

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN "payment_method" TEXT;