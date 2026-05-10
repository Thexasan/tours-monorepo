import { Type } from "class-transformer";
import {
  IsDateString, IsEmail, IsInt, IsOptional, IsString, Matches,
  MaxLength, Min, MinLength,
} from "class-validator";

export class CreateBookingDto {
  @IsString() @MinLength(1)
  tourId!: string;

  @IsString() @MinLength(2) @MaxLength(100)
  contactName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, { message: "Invalid phone format" })
  contactPhone!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  guestsCount?: number;

  @IsOptional() @IsDateString()
  preferredDate?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;
}
