-- DropForeignKey
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_user_id_fkey";

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "payment_status" "TransactionStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "ticket_number" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
ADD COLUMN     "tx_ref" TEXT,
ALTER COLUMN "amount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "wallet_balance";

-- DropTable
DROP TABLE "WalletTransaction";

-- CreateIndex
CREATE UNIQUE INDEX "Bid_ticket_number_key" ON "Bid"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_tx_ref_key" ON "Bid"("tx_ref");

