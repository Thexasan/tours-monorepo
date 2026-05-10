import { Type } from "class-transformer";
import {
  IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min,
} from "class-validator";
import { MealPlan } from "@tours/db";

export class ListToursDto {
  @IsOptional() @IsString()
  country?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  maxPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5)
  hotelStars?: number;

  @IsOptional() @IsEnum(MealPlan)
  mealPlan?: MealPlan;

  @IsOptional() @Type(() => Boolean) @IsBoolean()
  isHot?: boolean;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsEnum(["price_asc", "price_desc", "popular", "newest"] as const)
  sort?: "price_asc" | "price_desc" | "popular" | "newest";

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number = 12;
}
