import { IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches, Length } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123", minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiProperty({ example: "Иван Иванов" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @ApiPropertyOptional({ example: "+998901234567" })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, { message: "Invalid phone format" })
  phone?: string;

  @ApiPropertyOptional({ example: "ABCD1234", description: "Реферальный код пригласившего" })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  referralCode?: string;

  @ApiProperty({ example: "123456", description: "6-значный OTP-код из письма" })
  @IsString()
  @Length(6, 6, { message: "OTP должен быть 6 символов" })
  otp!: string;
}
