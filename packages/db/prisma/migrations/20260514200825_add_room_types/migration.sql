-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "room_type" TEXT;

-- AlterTable
ALTER TABLE "tours" ADD COLUMN     "room_types" JSONB NOT NULL DEFAULT '[]';
