import { IsOptional, IsString, MaxLength } from "class-validator";

export class TrackClickDto {
  @IsString() @MaxLength(16)
  referralCode!: string;

  @IsOptional() @IsString() @MaxLength(200)
  tourSlug?: string;

  @IsOptional() @IsString() @MaxLength(128)
  fingerprint?: string;
}
