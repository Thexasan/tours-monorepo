import { IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, { message: "Invalid phone format" })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  referralCode?: string;
}
