import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { put } from "@vercel/blob";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { PrismaService } from "../../../prisma/prisma.service";
import { EmailService } from "../../email/email.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { BookingDocumentKind, BookingStatus, NotificationType, UserRole } from "@tours/db";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import { RequestDocumentsDto } from "./dto/request-documents.dto";
import { RejectDocumentsDto } from "./dto/reject-documents.dto";

// ─── Magic-byte validation ───────────────────────────────────────────────────
// Checks only the bytes we actually allow (JPEG, PNG, WebP, PDF).
// Multer's mimetype field is a browser claim — not trustworthy.
function detectMime(buf: Buffer): string | null {
  if (buf.length < 8) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return "image/png";

  // WebP: RIFF????WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";

  // PDF: %PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf";

  return null;
}

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  return map[mime] ?? "bin";
}

// Sanitize a filename for use in Content-Disposition header
function sanitizeFileName(name: string): string {
  return name.replace(/[\r\n"<>:/\\|?*]/g, "_").slice(0, 200);
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class BookingDocumentsService {
  private readonly logger = new Logger(BookingDocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Access helpers ──────────────────────────────────────────────────────────

  private async assertBookingAccess(
    bookingId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: { select: { title: true, slug: true } } },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (userRole !== UserRole.ADMIN && booking.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }
    return booking;
  }

  // ── Storage helpers ─────────────────────────────────────────────────────────

  private async storeFile(
    bookingId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const ext = extFromMime(mimeType);
    const randomName = `${randomBytes(24).toString("hex")}.${ext}`;
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (token) {
      const blobPath = `bookings/${bookingId}/${randomName}`;
      const blob = await put(blobPath, buffer, {
        access: "public",
        token,
        contentType: mimeType,
        addRandomSuffix: false,
      });
      // Store the full Blob URL — used for proxied download only (never returned to client)
      return blob.url;
    }

    // Dev fallback: save to uploads/bookings/<bookingId>/
    const dir = join(process.cwd(), "uploads", "bookings", bookingId);
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, randomName);
    await writeFile(filePath, buffer);
    // Store relative path prefixed with "local:" so download handler knows
    return `local:bookings/${bookingId}/${randomName}`;
  }

  private async streamFile(
    storageKey: string,
    mimeType: string,
    fileName: string,
    res: Response,
  ): Promise<void> {
    const safeFileName = sanitizeFileName(fileName);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);
    res.setHeader("Cache-Control", "private, no-store");

    if (storageKey.startsWith("local:")) {
      const relPath = storageKey.slice("local:".length);
      const fullPath = join(process.cwd(), "uploads", relPath);
      try {
        const buf = await readFile(fullPath);
        res.end(buf);
      } catch {
        throw new NotFoundException("File not found on disk");
      }
      return;
    }

    // Vercel Blob URL — fetch and proxy (URL never crosses to client)
    const response = await fetch(storageKey);
    if (!response.ok) {
      throw new NotFoundException("File not available in storage");
    }
    // Node 18+ readable stream from web ReadableStream
    const { Readable } = await import("stream");
    Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
  }

  private async deleteStoredFile(storageKey: string): Promise<void> {
    if (storageKey.startsWith("local:")) {
      const relPath = storageKey.slice("local:".length);
      const fullPath = join(process.cwd(), "uploads", relPath);
      await unlink(fullPath).catch(() => undefined);
    }
    // Vercel Blob: no deletion API call — the random URL is effectively orphaned.
    // For this scale it's acceptable. Full cleanup can be added later via Vercel Blob list/del.
  }

  // ── Transition: request documents ──────────────────────────────────────────

  async requestDocuments(
    bookingId: string,
    adminId: string,
    dto: RequestDocumentsDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: { select: { title: true, slug: true } } },
    });
    if (!booking) throw new NotFoundException("Booking not found");

    const allowedFrom: BookingStatus[] = [BookingStatus.NEW, BookingStatus.IN_PROGRESS, BookingStatus.DOCUMENTS_SUBMITTED];
    if (!allowedFrom.includes(booking.status)) {
      throw new BadRequestException(`Cannot request documents from status "${booking.status}"`);
    }

    await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.DOCUMENTS_REQUESTED,
          statusChangedAt: new Date(),
          managerId: adminId,
        },
      }),
      this.prisma.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: BookingStatus.DOCUMENTS_REQUESTED,
          changedById: adminId,
          note: dto.note ?? null,
        },
      }),
    ]);

    this.logger.log(`Booking ${bookingId}: documents requested by admin ${adminId}`);

    const tourTitle = (booking.tour.title as { ru?: string }).ru ?? booking.tour.slug;
    void this.email.sendDocumentsRequested(
      booking.contactEmail,
      booking.contactName,
      tourTitle,
      bookingId,
      dto.note,
    ).catch(() => undefined);

    if (booking.userId) {
      void this.notifications.create({
        userId: booking.userId,
        type: NotificationType.BOOKING_DOCUMENTS_REQUESTED,
        title: "Требуются документы",
        body: `Для тура «${tourTitle}» загрузите паспорт(а) в личном кабинете.`,
        bookingId,
      });
    }

    return { success: true };
  }

  // ── Upload document ─────────────────────────────────────────────────────────

  async uploadDocument(
    bookingId: string,
    userId: string,
    userRole: UserRole,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
  ) {
    const booking = await this.assertBookingAccess(bookingId, userId, userRole);

    // Guests (userId === null) must register first
    if (userRole !== UserRole.ADMIN && booking.userId === null) {
      throw new BadRequestException("Сначала зарегистрируйтесь, чтобы загружать документы");
    }

    if (!file) throw new BadRequestException("Файл не передан");
    if (file.size > MAX_SIZE) throw new BadRequestException("Файл слишком большой (максимум 10 МБ)");

    const detectedMime = detectMime(file.buffer);
    if (!detectedMime || !ALLOWED_MIMES.includes(detectedMime)) {
      throw new BadRequestException("Тип файла не поддерживается. Допустимы JPEG, PNG, WebP, PDF");
    }

    const storageKey = await this.storeFile(bookingId, file.buffer, detectedMime);

    const doc = await this.prisma.bookingDocument.create({
      data: {
        bookingId,
        kind: dto.kind,
        uploadedById: userId,
        storageKey,
        fileName: file.originalname.slice(0, 255),
        sizeBytes: file.size,
        mimeType: detectedMime,
        description: dto.description ?? null,
        visibleToClient: true,
      },
    });

    // Auto-transition: client uploads while status is DOCUMENTS_REQUESTED → DOCUMENTS_SUBMITTED
    if (userRole !== UserRole.ADMIN && booking.status === BookingStatus.DOCUMENTS_REQUESTED) {
      await this.prisma.$transaction([
        this.prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.DOCUMENTS_SUBMITTED, statusChangedAt: new Date() },
        }),
        this.prisma.bookingStatusHistory.create({
          data: {
            bookingId,
            fromStatus: BookingStatus.DOCUMENTS_REQUESTED,
            toStatus: BookingStatus.DOCUMENTS_SUBMITTED,
            changedById: userId,
            note: "Документы загружены клиентом",
          },
        }),
      ]);

      // Notify admin
      const managerEmail = await this.getManagerEmail(booking.managerId);
      if (managerEmail) {
        const tourTitle = (booking.tour.title as { ru?: string }).ru ?? booking.tour.slug;
        void this.email.sendDocumentsSubmitted(
          managerEmail,
          booking.contactName,
          tourTitle,
          bookingId,
        ).catch(() => undefined);
      }
    }

    this.logger.log(`Booking ${bookingId}: document ${doc.id} uploaded by ${userId}`);
    return this.serializeDoc(doc);
  }

  // ── List documents ──────────────────────────────────────────────────────────

  async listDocuments(bookingId: string, userId: string, userRole: UserRole) {
    const booking = await this.assertBookingAccess(bookingId, userId, userRole);

    const where =
      userRole === UserRole.ADMIN
        ? { bookingId }
        : { bookingId, visibleToClient: true };

    const docs = await this.prisma.bookingDocument.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return {
      booking: { id: booking.id, status: booking.status },
      documents: docs.map((d) => this.serializeDoc(d)),
    };
  }

  // ── Download document ───────────────────────────────────────────────────────

  async downloadDocument(
    bookingId: string,
    docId: string,
    userId: string,
    userRole: UserRole,
    res: Response,
  ): Promise<void> {
    const booking = await this.assertBookingAccess(bookingId, userId, userRole);
    void booking; // ACL already checked

    const doc = await this.prisma.bookingDocument.findFirst({
      where: { id: docId, bookingId },
    });
    if (!doc) throw new NotFoundException("Document not found");

    if (userRole !== UserRole.ADMIN && !doc.visibleToClient) {
      throw new ForbiddenException("Access denied");
    }

    this.logger.log(`Download: doc=${docId} by user=${userId} (${userRole})`);
    await this.streamFile(doc.storageKey, doc.mimeType, doc.fileName, res);
  }

  // ── Delete document ─────────────────────────────────────────────────────────

  async deleteDocument(
    bookingId: string,
    docId: string,
    userId: string,
    userRole: UserRole,
  ) {
    await this.assertBookingAccess(bookingId, userId, userRole);

    const doc = await this.prisma.bookingDocument.findFirst({
      where: { id: docId, bookingId },
    });
    if (!doc) throw new NotFoundException("Document not found");

    const isUploader = doc.uploadedById === userId;
    const uploadedRecently =
      doc.createdAt.getTime() > Date.now() - 5 * 60 * 1000;

    if (userRole !== UserRole.ADMIN && !(isUploader && uploadedRecently)) {
      throw new ForbiddenException(
        "Удалить документ можно только в течение 5 минут после загрузки",
      );
    }

    await this.prisma.bookingDocument.delete({ where: { id: docId } });
    await this.deleteStoredFile(doc.storageKey);

    this.logger.log(`Document ${docId} deleted by user=${userId}`);
    return { success: true };
  }

  // ── Transition: confirm documents ──────────────────────────────────────────

  async confirmDocuments(bookingId: string, adminId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking not found");

    if (booking.status !== BookingStatus.DOCUMENTS_SUBMITTED) {
      throw new BadRequestException(
        `Expected status DOCUMENTS_SUBMITTED, got "${booking.status}"`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.IN_PROGRESS,
          statusChangedAt: new Date(),
          managerId: adminId,
          // Mark all submitted docs as confirmed
        },
      }),
      this.prisma.bookingDocument.updateMany({
        where: { bookingId, confirmedAt: null },
        data: { confirmedAt: new Date(), confirmedById: adminId },
      }),
      this.prisma.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: BookingStatus.DOCUMENTS_SUBMITTED,
          toStatus: BookingStatus.IN_PROGRESS,
          changedById: adminId,
          note: "Документы подтверждены",
        },
      }),
    ]);

    this.logger.log(`Booking ${bookingId}: documents confirmed by admin ${adminId}`);

    const tour = await this.prisma.tour.findUnique({
      where: { id: booking.tourId }, select: { title: true, slug: true },
    });
    const tourTitle = (tour?.title as { ru?: string } | null)?.ru ?? booking.tourId;
    void this.email.sendDocumentsConfirmed(
      booking.contactEmail,
      booking.contactName,
      tourTitle,
      bookingId,
    ).catch(() => undefined);

    if (booking.userId) {
      void this.notifications.create({
        userId: booking.userId,
        type: NotificationType.BOOKING_DOCUMENTS_CONFIRMED,
        title: "Документы приняты",
        body: `Ваши документы для тура «${tourTitle}» подтверждены. Ожидайте информацию об оплате.`,
        bookingId,
      });
    }

    return { success: true };
  }

  // ── Transition: reject documents ───────────────────────────────────────────

  async rejectDocuments(
    bookingId: string,
    adminId: string,
    dto: RejectDocumentsDto,
  ) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking not found");

    if (booking.status !== BookingStatus.DOCUMENTS_SUBMITTED) {
      throw new BadRequestException(
        `Expected status DOCUMENTS_SUBMITTED, got "${booking.status}"`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.DOCUMENTS_REQUESTED, statusChangedAt: new Date() },
      }),
      this.prisma.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: BookingStatus.DOCUMENTS_SUBMITTED,
          toStatus: BookingStatus.DOCUMENTS_REQUESTED,
          changedById: adminId,
          note: dto.rejectionNote,
        },
      }),
    ]);

    this.logger.log(`Booking ${bookingId}: documents rejected by admin ${adminId}`);

    const tour = await this.prisma.tour.findUnique({
      where: { id: booking.tourId }, select: { title: true, slug: true },
    });
    const tourTitle = (tour?.title as { ru?: string } | null)?.ru ?? booking.tourId;
    void this.email.sendDocumentsRejected(
      booking.contactEmail,
      booking.contactName,
      tourTitle,
      bookingId,
      dto.rejectionNote,
    ).catch(() => undefined);

    if (booking.userId) {
      void this.notifications.create({
        userId: booking.userId,
        type: NotificationType.BOOKING_DOCUMENTS_REJECTED,
        title: "Нужны исправления",
        body: `Исправьте документы для тура «${tourTitle}»: ${dto.rejectionNote}`,
        bookingId,
      });
    }

    return { success: true };
  }

  // ── Get status history ──────────────────────────────────────────────────────

  async getHistory(bookingId: string, userId: string, userRole: UserRole) {
    await this.assertBookingAccess(bookingId, userId, userRole);

    const history = await this.prisma.bookingStatusHistory.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
    });

    return history.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      changedById: h.changedById,
      note: h.note,
      createdAt: h.createdAt.toISOString(),
    }));
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async getManagerEmail(managerId: string | null): Promise<string | null> {
    if (managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId }, select: { email: true },
      });
      if (manager?.email) return manager.email;
    }
    return process.env.ADMIN_NOTIFY_EMAIL ?? null;
  }

  private serializeDoc(d: {
    id: string; bookingId: string; kind: BookingDocumentKind;
    uploadedById: string | null; fileName: string; sizeBytes: number; mimeType: string;
    description: string | null; visibleToClient: boolean;
    confirmedAt: Date | null; confirmedById: string | null;
    rejectionNote: string | null; createdAt: Date;
  }) {
    return {
      id: d.id,
      bookingId: d.bookingId,
      kind: d.kind,
      uploadedById: d.uploadedById,
      fileName: d.fileName,
      sizeBytes: d.sizeBytes,
      mimeType: d.mimeType,
      description: d.description,
      visibleToClient: d.visibleToClient,
      confirmedAt: d.confirmedAt?.toISOString() ?? null,
      confirmedById: d.confirmedById,
      rejectionNote: d.rejectionNote,
      createdAt: d.createdAt.toISOString(),
    };
  }
}
