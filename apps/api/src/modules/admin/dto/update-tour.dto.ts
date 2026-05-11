import { PartialType } from "@nestjs/swagger";
import { CreateTourDto } from "./create-tour.dto";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateTourDto extends PartialType(CreateTourDto) {
  @ApiPropertyOptional({ example: true, description: "false = архивировать тур" })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
