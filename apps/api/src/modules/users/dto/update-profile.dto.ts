import { IsOptional, IsString, MinLength, MaxLength, Matches, IsUrl } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, { message: "Invalid phone format" })
  phone?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;
}
