import { Type } from "class-transformer";
import {
  IsDateString, IsEmail, IsInt, IsOptional, IsString, Matches,
  MaxLength, Min, MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateBookingDto {
  @ApiProperty({ example: "cuid_tour_id_here", description: "ID тура" })
  @IsString() @MinLength(1)
  tourId!: string;

  @ApiProperty({ example: "Иван Иванов" })
  @IsString() @MinLength(2) @MaxLength(100)
  contactName!: string;

  @ApiProperty({ example: "ivan@example.com" })
  @IsEmail()
  contactEmail!: string;

  @ApiProperty({ example: "+998901234567" })
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, { message: "Invalid phone format" })
  contactPhone!: string;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  guestsCount?: number;

  @ApiPropertyOptional({ example: "2025-08-15", description: "Желаемая дата вылета (YYYY-MM-DD)" })
  @IsOptional() @IsDateString()
  preferredDate?: string;

  @ApiPropertyOptional({ example: "Делюкс с видом", description: "Тип номера/размещения" })
  @IsOptional() @IsString() @MaxLength(200)
  roomType?: string;

  @ApiPropertyOptional({ example: "Предпочитаем номер с видом на море" })
  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;
}
