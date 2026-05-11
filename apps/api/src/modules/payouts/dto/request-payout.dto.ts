import { Type } from "class-transformer";
import {
  IsNumber, IsObject, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class BankDetailsDto {
  @ApiProperty({ example: "Тинькофф Банк" })
  @IsString() @MinLength(2) @MaxLength(200)
  bank!: string;

  @ApiProperty({ example: "40817810000001234567" })
  @IsString() @MinLength(4) @MaxLength(50)
  accountNumber!: string;

  @ApiPropertyOptional({ example: "TICSRUMMXXX" })
  @IsOptional() @IsString() @MaxLength(20)
  swift?: string;

  @ApiProperty({ example: "Иванов Иван Иванович" })
  @IsString() @MinLength(2) @MaxLength(200)
  beneficiary!: string;
}

export class RequestPayoutDto {
  @ApiProperty({ example: 150, minimum: 50, description: "Сумма вывода в USD (минимум $50)" })
  @Type(() => Number) @IsNumber() @Min(50)
  amountUsd!: number;

  @ApiProperty({ type: BankDetailsDto })
  @IsObject() @ValidateNested() @Type(() => BankDetailsDto)
  bankDetails!: BankDetailsDto;
}
