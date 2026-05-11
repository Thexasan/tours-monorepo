import { Type } from "class-transformer";
import {
  ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUrl,
  Max, MaxLength, Min, MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateReviewDto {
  @ApiProperty({ example: "cuid_tour_id_here", description: "ID тура" })
  @IsString() @MinLength(1) @MaxLength(64)
  tourId!: string;

  @ApiPropertyOptional({ example: "cuid_booking_id_here", description: "ID заявки (необязательно)" })
  @IsOptional() @IsString() @MaxLength(64)
  bookingId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number) @IsInt() @Min(1) @Max(5)
  rating!: number;

  @ApiProperty({ example: "Отличный тур, всё организовано на высшем уровне. Обязательно вернёмся!" })
  @IsString() @MinLength(10) @MaxLength(2000)
  text!: string;

  @ApiPropertyOptional({ example: ["https://example.com/photo1.jpg"] })
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsUrl({ require_tld: false }, { each: true })
  photoUrls?: string[];
}
