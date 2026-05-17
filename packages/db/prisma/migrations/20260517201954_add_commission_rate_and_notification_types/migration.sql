-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'COMMISSION_EARNED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_PROCESSED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_REJECTED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "commission_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.05;
