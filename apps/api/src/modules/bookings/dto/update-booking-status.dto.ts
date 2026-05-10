import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { BookingStatus } from "@tours/db";

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @IsOptional() @IsString() @MaxLength(500)
  cancelReason?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  managerNotes?: string;
}
