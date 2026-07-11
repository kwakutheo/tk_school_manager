-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MTN_MOMO');

-- AlterTable
ALTER TABLE "fee_payments"
ADD COLUMN "provider" "PaymentProvider",
ADD COLUMN "provider_transaction_id" TEXT,
ADD COLUMN "provider_reference" TEXT,
ADD COLUMN "provider_status" TEXT,
ADD COLUMN "provider_metadata" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_provider_provider_transaction_id_key" ON "fee_payments"("provider", "provider_transaction_id");

-- CreateIndex
CREATE INDEX "fee_payments_school_id_provider_status_idx" ON "fee_payments"("school_id", "provider", "status");
