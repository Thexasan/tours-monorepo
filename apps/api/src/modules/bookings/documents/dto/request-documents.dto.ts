import { IsOptional, IsString, MaxLength } from "class-validator";

export class RequestDocumentsDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
