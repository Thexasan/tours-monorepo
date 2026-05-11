import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BookingStatus } from "@tours/db";

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.IN_PROGRESS })
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @ApiPropertyOptional({ example: "Клиент отказался от поездки" })
  @IsOptional() @IsString() @MaxLength(500)
  cancelReason?: string;

  @ApiPropertyOptional({ example: "Созвонились, подтвердили даты" })
  @IsOptional() @IsString() @MaxLength(2000)
  managerNotes?: string;
}
