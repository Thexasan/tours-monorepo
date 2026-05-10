import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export enum PayoutDecision { APPROVE = "APPROVE", REJECT = "REJECT" }

export class ProcessPayoutDto {
  @IsEnum(PayoutDecision)
  decision!: PayoutDecision;

  @IsOptional() @IsString() @MaxLength(100)
  externalRef?: string; // ID банковской транзакции

  @IsOptional() @IsString() @MaxLength(500)
  rejectReason?: string;
}
