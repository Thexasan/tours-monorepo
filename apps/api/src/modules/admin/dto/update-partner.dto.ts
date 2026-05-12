import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdatePartnerDto {
  @ApiPropertyOptional({ example: "Иван Петров" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({ example: "+992900000000" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: true, description: "Активен ли партнёр. false = деактивирован." })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
