import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { put } from "@vercel/blob";
import { ApiConsumes, ApiBody, ApiTags } from "@nestjs/swagger";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

@ApiTags("upload")
@Controller("upload")
export class UploadController {
  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } })
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_SIZE } }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("Файл не передан");
    if (!ALLOWED_TYPES.includes(file.mimetype))
      throw new BadRequestException("Допустимы только JPEG, PNG, WebP, GIF");

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (token) {
      const ext = file.originalname.split(".").pop() ?? "jpg";
      const name = `tours/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const blob = await put(name, file.buffer, {
        access: "public",
        token,
        contentType: file.mimetype,
      });
      return { url: blob.url };
    }

    // Dev fallback: save to local uploads/ directory and serve statically
    const ext = file.originalname.split(".").pop() ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadsDir = join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, filename), file.buffer);

    const port = process.env.PORT ?? 4000;
    return { url: `http://localhost:${port}/uploads/${filename}` };
  }
}
