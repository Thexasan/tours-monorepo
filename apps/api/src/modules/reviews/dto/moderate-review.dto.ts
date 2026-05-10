import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export enum ModerationDecision { APPROVE = "APPROVE", REJECT = "REJECT" }

export class ModerateReviewDto {
  @IsEnum(ModerationDecision)
  decision!: ModerationDecision;

  @IsOptional() @IsString() @MaxLength(500)
  rejectReason?: string;
}
