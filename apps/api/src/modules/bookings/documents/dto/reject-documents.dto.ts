import { IsString, MinLength, MaxLength } from "class-validator";

export class RejectDocumentsDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  rejectionNote!: string;
}
