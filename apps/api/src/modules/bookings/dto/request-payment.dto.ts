import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class RequestPaymentDto {
  @ApiProperty({ example: "Сбербанк" })
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @ApiProperty({ example: "4276 1234 5678 9012" })
  @IsString()
  @IsNotEmpty()
  cardNumber!: string;

  @ApiProperty({ example: "Переводите на имя Иванов Иван Иванович. Укажите номер заявки в комментарии." })
  @IsString()
  @IsNotEmpty()
  instructions!: string;

  @ApiPropertyOptional({ description: "Сумма к оплате. Если не указана — берётся totalPriceUsd заявки." })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount?: number;
}
