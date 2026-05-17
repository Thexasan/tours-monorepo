import { IsEmail, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";
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

  @ApiPropertyOptional({ example: 0.05, description: "Ставка комиссии (от 0.01 до 1). По умолчанию 0.05 = 5%." })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(1)
  commissionRate?: number;
}
