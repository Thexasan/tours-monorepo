import { Module } from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { BookingsController } from "./bookings.controller";
import { BookingDocumentsController } from "./documents/booking-documents.controller";
import { BookingDocumentsService } from "./documents/booking-documents.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [BookingsController, BookingDocumentsController],
  providers: [BookingsService, BookingDocumentsService],
  exports: [BookingsService],
})
export class BookingsModule {}
