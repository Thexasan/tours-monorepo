import { Type } from "class-transformer";
import {
  IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString,
  Matches, Max, MaxLength, Min, MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MealPlan } from "@tours/db";

export class CreateTourDto {
  @ApiProperty({ example: "bali-7-nights", description: "Уникальный slug (a-z, 0-9, дефис)" })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: "slug must be lowercase letters, numbers and dashes" })
  @MinLength(3) @MaxLength(120)
  slug!: string;

  @ApiProperty({ example: { ru: "Бали — остров богов", en: "Bali — Island of Gods" } })
  @IsObject()
  title!: Record<string, string>;

  @ApiProperty({ example: { ru: "7 ночей в тропическом раю...", en: "7 nights in a tropical paradise..." } })
  @IsObject()
  description!: Record<string, string>;

  @ApiPropertyOptional({ example: { ru: ["Перелёт", "Отель"], en: ["Flights", "Hotel"] } })
  @IsOptional() @IsObject()
  programIncluded?: Record<string, string[]>;

  @ApiPropertyOptional({ example: { ru: ["Виза", "Страховка"], en: ["Visa", "Insurance"] } })
  @IsOptional() @IsObject()
  programExcluded?: Record<string, string[]>;

  @ApiProperty({ example: "Индонезия" })
  @IsString() @MinLength(2) @MaxLength(100)
  country!: string;

  @ApiPropertyOptional({ example: "Денпасар" })
  @IsOptional() @IsString() @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: "Kempinski Bali" })
  @IsOptional() @IsString() @MaxLength(200)
  hotelName?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5)
  hotelStars?: number;

  @ApiPropertyOptional({ enum: MealPlan, example: MealPlan.ALL_INCLUSIVE })
  @IsOptional() @IsEnum(MealPlan)
  mealPlan?: MealPlan;

  @ApiPropertyOptional({ example: 7, minimum: 1, maximum: 60 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60)
  durationDays?: number;

  @ApiProperty({ example: 1290, description: "Цена в USD" })
  @Type(() => Number) @IsNumber() @Min(0)
  priceUsd!: number;

  @ApiProperty({ example: "https://images.unsplash.com/photo-xxx?w=800" })
  @IsString() @MinLength(5)
  coverImage!: string;

  @ApiPropertyOptional({ example: ["https://images.unsplash.com/photo-yyy"] })
  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  isHot?: boolean;

  @ApiPropertyOptional({ example: 50, description: "Кол-во рефералов для бесплатного тура" })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  referralThreshold?: number;
}
