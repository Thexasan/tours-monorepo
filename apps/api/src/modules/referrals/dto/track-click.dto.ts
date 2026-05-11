import { IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TrackClickDto {
  @ApiProperty({ example: "ABCD1234", description: "Реферальный код пользователя" })
  @IsString() @MaxLength(16)
  referralCode!: string;

  @ApiPropertyOptional({ example: "bali-7-nights" })
  @IsOptional() @IsString() @MaxLength(200)
  tourSlug?: string;

  @ApiPropertyOptional({ example: "fp_abc123xyz" })
  @IsOptional() @IsString() @MaxLength(128)
  fingerprint?: string;
}
