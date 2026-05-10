import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export enum ApplicationDecision { APPROVE = "APPROVE", REJECT = "REJECT" }

export class ReviewApplicationDto {
  @IsEnum(ApplicationDecision)
  decision!: ApplicationDecision;

  @IsOptional() @IsString() @MaxLength(500)
  rejectReason?: string;
}
