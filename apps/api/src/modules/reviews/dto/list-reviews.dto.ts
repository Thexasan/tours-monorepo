import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ReviewStatus } from "@tours/db";

export class ListReviewsDto {
  @IsOptional() @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @IsOptional() @IsString()
  tourId?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number = 12;
}
