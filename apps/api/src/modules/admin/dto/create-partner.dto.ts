import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePartnerDto {
  @ApiProperty({ example: "blogger@example.com", description: "Email партнёра. Будет использован для входа." })
  @IsEmail({}, { message: "email must be a valid email" })
  @MaxLength(200)
  email!: string;

  @ApiProperty({ example: "Иван Петров", description: "Полное имя партнёра" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName!: string;

  @ApiPropertyOptional({ example: "+992900000000", description: "Телефон партнёра (опционально)" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}
