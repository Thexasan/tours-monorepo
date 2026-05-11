import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "admin@tours.local" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "admin123" })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string;
}
