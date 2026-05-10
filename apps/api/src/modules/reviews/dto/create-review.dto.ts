import { Type } from "class-transformer";
import {
  ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUrl,
  Max, MaxLength, Min, MinLength,
} from "class-validator";

export class CreateReviewDto {
  @IsString() @MinLength(1) @MaxLength(64)
  tourId!: string;

  @IsOptional() @IsString() @MaxLength(64)
  bookingId?: string;

  @Type(() => Number) @IsInt() @Min(1) @Max(5)
  rating!: number;

  @IsString() @MinLength(10) @MaxLength(2000)
  text!: string;

  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsUrl({ require_tld: false }, { each: true })
  photoUrls?: string[];
}
