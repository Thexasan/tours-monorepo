import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { Response } from "express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { BookingDocumentsService } from "./booking-documents.service";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import { RequestDocumentsDto } from "./dto/request-documents.dto";
import { RejectDocumentsDto } from "./dto/reject-documents.dto";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { UserRole } from "@tours/db";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@ApiTags("Booking Documents")
@Controller("bookings/:bookingId")
export class BookingDocumentsController {
  constructor(private readonly docs: BookingDocumentsService) {}

  // ── Transitions ─────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("transitions/request-documents")
  requestDocuments(
    @Param("bookingId") bookingId: string,
    @Body() dto: RequestDocumentsDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.docs.requestDocuments(bookingId, admin.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("transitions/confirm-documents")
  confirmDocuments(
    @Param("bookingId") bookingId: string,
    @CurrentUser() admin: { id: string },
  ) {
    return this.docs.confirmDocuments(bookingId, admin.id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("transitions/reject-documents")
  rejectDocuments(
    @Param("bookingId") bookingId: string,
    @Body() dto: RejectDocumentsDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.docs.rejectDocuments(bookingId, admin.id, dto);
  }

  // ── Documents CRUD ──────────────────────────────────────────────────────────

  @Post("documents")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadDocument(
    @Param("bookingId") bookingId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.docs.uploadDocument(bookingId, user.id, user.role, file, dto);
  }

  @Get("documents")
  listDocuments(
    @Param("bookingId") bookingId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.docs.listDocuments(bookingId, user.id, user.role);
  }

  @Get("documents/:docId/download")
  async downloadDocument(
    @Param("bookingId") bookingId: string,
    @Param("docId") docId: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Res() res: Response,
  ) {
    await this.docs.downloadDocument(bookingId, docId, user.id, user.role, res);
  }

  @Delete("documents/:docId")
  deleteDocument(
    @Param("bookingId") bookingId: string,
    @Param("docId") docId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.docs.deleteDocument(bookingId, docId, user.id, user.role);
  }

  // ── History ─────────────────────────────────────────────────────────────────

  @Get("history")
  getHistory(
    @Param("bookingId") bookingId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.docs.getHistory(bookingId, user.id, user.role);
  }
}
