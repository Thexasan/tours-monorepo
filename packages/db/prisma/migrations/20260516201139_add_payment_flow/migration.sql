-- AlterEnum
ALTER TYPE "BookingDocumentKind" ADD VALUE 'PAYMENT_RECEIPT';

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'AWAITING_PAYMENT';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_PAYMENT_REQUESTED';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "payment_details" JSONB;
