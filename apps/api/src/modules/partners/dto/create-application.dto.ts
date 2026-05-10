import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateApplicationDto {
  @IsString() @MinLength(20) @MaxLength(2000)
  motivation!: string;

  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsUrl({ require_tld: false }, { each: true })
  socialLinks?: string[];

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100_000_000)
  audienceSize?: number;
}
