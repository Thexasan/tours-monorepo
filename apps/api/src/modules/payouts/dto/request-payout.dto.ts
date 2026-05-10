import { Type } from "class-transformer";
import {
  IsNumber, IsObject, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested,
} from "class-validator";

export class BankDetailsDto {
  @IsString() @MinLength(2) @MaxLength(200)
  bank!: string;

  @IsString() @MinLength(4) @MaxLength(50)
  accountNumber!: string;

  @IsOptional() @IsString() @MaxLength(20)
  swift?: string;

  @IsString() @MinLength(2) @MaxLength(200)
  beneficiary!: string;
}

export class RequestPayoutDto {
  @Type(() => Number) @IsNumber() @Min(50)
  amountUsd!: number;

  @IsObject() @ValidateNested() @Type(() => BankDetailsDto)
  bankDetails!: BankDetailsDto;
}
