import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum ModerationDecision { APPROVE = "APPROVE", REJECT = "REJECT" }

export class ModerateReviewDto {
  @ApiProperty({ enum: ModerationDecision, example: ModerationDecision.APPROVE })
  @IsEnum(ModerationDecision)
  decision!: ModerationDecision;

  @ApiPropertyOptional({ example: "Содержит ненормативную лексику" })
  @IsOptional() @IsString() @MaxLength(500)
  rejectReason?: string;
}
