import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { BookingDocumentKind } from "@tours/db";

export class UploadDocumentDto {
  @IsEnum(BookingDocumentKind)
  kind!: BookingDocumentKind;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
