import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum ApplicationDecision { APPROVE = "APPROVE", REJECT = "REJECT" }

export class ReviewApplicationDto {
  @ApiProperty({ enum: ApplicationDecision, example: ApplicationDecision.APPROVE })
  @IsEnum(ApplicationDecision)
  decision!: ApplicationDecision;

  @ApiPropertyOptional({ example: "Аудитория не соответствует требованиям" })
  @IsOptional() @IsString() @MaxLength(500)
  rejectReason?: string;
}
