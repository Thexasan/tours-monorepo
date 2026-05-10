import { PartialType } from "@nestjs/mapped-types";
import { CreateTourDto } from "./create-tour.dto";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateTourDto extends PartialType(CreateTourDto) {
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
