import { Type } from "class-transformer";
import {
  IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString,
  Matches, Max, MaxLength, Min, MinLength,
} from "class-validator";
import { MealPlan } from "@tours/db";

export class CreateTourDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: "slug must be lowercase letters, numbers and dashes" })
  @MinLength(3) @MaxLength(120)
  slug!: string;

  @IsObject()
  title!: Record<string, string>;

  @IsObject()
  description!: Record<string, string>;

  @IsOptional() @IsArray()
  programIncluded?: Record<string, string>[];

  @IsOptional() @IsArray()
  programExcluded?: Record<string, string>[];

  @IsString() @MinLength(2) @MaxLength(100)
  country!: string;

  @IsOptional() @IsString() @MaxLength(100)
  city?: string;

  @IsOptional() @IsString() @MaxLength(200)
  hotelName?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5)
  hotelStars?: number;

  @IsOptional() @IsEnum(MealPlan)
  mealPlan?: MealPlan;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60)
  durationDays?: number;

  @Type(() => Number) @IsNumber() @Min(0)
  priceUsd!: number;

  @IsString() @MinLength(5)
  coverImage!: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];

  @IsOptional() @IsBoolean()
  isHot?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  referralThreshold?: number;
}
