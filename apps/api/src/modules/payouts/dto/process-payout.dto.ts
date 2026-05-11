import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum PayoutDecision { APPROVE = "APPROVE", REJECT = "REJECT" }

export class ProcessPayoutDto {
  @ApiProperty({ enum: PayoutDecision, example: PayoutDecision.APPROVE })
  @IsEnum(PayoutDecision)
  decision!: PayoutDecision;

  @ApiPropertyOptional({ example: "TXN-20250801-00123", description: "ID банковской транзакции" })
  @IsOptional() @IsString() @MaxLength(100)
  externalRef?: string;

  @ApiPropertyOptional({ example: "Недостаточно средств на счёте" })
  @IsOptional() @IsString() @MaxLength(500)
  rejectReason?: string;
}
