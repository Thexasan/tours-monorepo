import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateApplicationDto {
  @ApiProperty({ example: "Я тревел-блогер с аудиторией 50к, пишу о путешествиях по Азии уже 3 года." })
  @IsString() @MinLength(20) @MaxLength(2000)
  motivation!: string;

  @ApiPropertyOptional({ example: ["https://instagram.com/my_travel", "https://t.me/my_channel"] })
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsUrl({ require_tld: false }, { each: true })
  socialLinks?: string[];

  @ApiPropertyOptional({ example: 50000, description: "Размер аудитории" })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100_000_000)
  audienceSize?: number;
}
