import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as path from "path";
import * as fs from "fs";
import * as QRCode from "qrcode";

// pdfkit must be required (not imported) to work correctly in CommonJS NestJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit") as typeof import("pdfkit");

export interface TicketData {
  bookingId: string;
  tourTitle: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  guestsCount: number;
  preferredDate: string | null;
  totalPriceUsd: number;
  country: string;
  city: string | null;
  durationDays: number;
  hotelName: string | null;
  paidAt: string;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly fontRegular: string | undefined;
  private readonly fontBold: string | undefined;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    const fontsDir = path.join(__dirname, "fonts");

    // Env-vars allow overriding font paths in production (e.g. Linux DejaVu)
    const envRegular = this.config.get<string>("PDF_FONT_REGULAR");
    const envBold = this.config.get<string>("PDF_FONT_BOLD");

    const localRegular = path.join(fontsDir, "Arial-Regular.ttf");
    const localBold = path.join(fontsDir, "Arial-Bold.ttf");

    this.fontRegular = envRegular ?? (fs.existsSync(localRegular) ? localRegular : undefined);
    this.fontBold = envBold ?? (fs.existsSync(localBold) ? localBold : undefined);
    this.appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";

    if (!this.fontRegular) {
      this.logger.warn(
        "No Cyrillic font found — PDF will use Helvetica (Cyrillic may not render). " +
          "Set PDF_FONT_REGULAR / PDF_FONT_BOLD env vars or place Arial-Regular.ttf / Arial-Bold.ttf " +
          "in src/modules/pdf/fonts/",
      );
    }
  }

  async generateTicket(data: TicketData): Promise<Buffer> {
    const qrUrl = `${this.appUrl}/ru/dashboard/trips/${data.bookingId}`;
    const qrBuffer = await QRCode.toBuffer(qrUrl, {
      type: "png",
      width: 130,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        info: { Title: "Подтверждение бронирования", Author: "Tours" },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      this.renderTicket(doc, data, qrBuffer);
      doc.end();
    });
  }

  private font(doc: InstanceType<typeof PDFDocument>, bold = false) {
    if (bold) {
      doc.font(this.fontBold ?? "Helvetica-Bold");
    } else {
      doc.font(this.fontRegular ?? "Helvetica");
    }
    return doc;
  }

  private renderTicket(
    doc: InstanceType<typeof PDFDocument>,
    data: TicketData,
    qrBuffer: Buffer,
  ) {
    const W = doc.page.width;
    const H = doc.page.height;
    const MARGIN = 48;

    // ── Background ──────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill("#f8fafc");

    // ── Header bar ──────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill("#0d9488");

    // Logo
    this.font(doc, true).fontSize(28).fillColor("#ffffff").text("Tours", MARGIN, 22);
    this.font(doc, false).fontSize(11).fillColor("rgba(255,255,255,0.75)")
      .text("ПОДТВЕРЖДЕНИЕ БРОНИРОВАНИЯ", MARGIN, 56);

    // Ticket number in top-right
    this.font(doc, true).fontSize(11).fillColor("rgba(255,255,255,0.6)")
      .text("ЗАЯВКА", W - 200, 22, { width: 150, align: "right" });
    this.font(doc, true).fontSize(14).fillColor("#ffffff")
      .text(`#${data.bookingId.slice(0, 8).toUpperCase()}`, W - 200, 40, { width: 150, align: "right" });

    // ── Main card ───────────────────────────────────────────────
    const cardX = MARGIN;
    const cardY = 110;
    const cardW = W - MARGIN * 2;
    const cardH = H - cardY - MARGIN;

    doc.roundedRect(cardX, cardY, cardW, cardH, 12).fill("#ffffff");

    // ── QR code + booking ID ─────────────────────────────────────
    const qrX = W - MARGIN - 150;
    const qrY = cardY + 24;
    doc.image(qrBuffer, qrX, qrY, { width: 130 });

    this.font(doc, false).fontSize(8).fillColor("#94a3b8")
      .text("Отсканируйте для\nпросмотра заявки", qrX, qrY + 135, { width: 130, align: "center" });

    // ── Tour info ────────────────────────────────────────────────
    const infoX = cardX + 32;
    let y = cardY + 32;

    this.font(doc, false).fontSize(9).fillColor("#94a3b8").text("ТУР", infoX, y);
    y += 14;
    this.font(doc, true).fontSize(20).fillColor("#0f172a")
      .text(data.tourTitle, infoX, y, { width: qrX - infoX - 24 });
    y = (doc as any).y + 6;

    const location = [data.country, data.city].filter(Boolean).join(" · ");
    const duration = `${data.durationDays} дн.`;
    this.font(doc, false).fontSize(12).fillColor("#64748b")
      .text(`${location} · ${duration}`, infoX, y);
    y += 28;

    // ── Divider ──────────────────────────────────────────────────
    doc.moveTo(infoX, y).lineTo(W - MARGIN - 32, y).strokeColor("#e2e8f0").lineWidth(1).stroke();
    y += 24;

    // ── Info grid (2 columns) ─────────────────────────────────────
    const colW = (qrX - infoX - 24) / 2;
    const fields: [string, string][] = [
      ["ТУРИСТ", data.contactName],
      ["ГОСТЕЙ", `${data.guestsCount} чел.`],
      ["EMAIL", data.contactEmail],
      ["ТЕЛЕФОН", data.contactPhone],
      ["ДАТА ТУРА", data.preferredDate ? this.formatDate(data.preferredDate) : "Уточняется"],
      ["ОТЕЛЬ", data.hotelName ?? "Уточняется"],
    ];

    const startY = y;
    fields.forEach(([label, value], i) => {
      const col = i % 2 === 0 ? 0 : colW + 16;
      const row = Math.floor(i / 2);
      const fy = startY + row * 60;

      this.font(doc, false).fontSize(8).fillColor("#94a3b8").text(label, infoX + col, fy);
      this.font(doc, true).fontSize(13).fillColor("#0f172a")
        .text(value, infoX + col, fy + 12, { width: colW - 8 });

      // row separator (only between rows, not after last)
      if (row < Math.floor((fields.length - 1) / 2)) {
        const lineY = fy + 50;
        doc.moveTo(infoX + col, lineY)
          .lineTo(infoX + col + colW - 8, lineY)
          .strokeColor("#f1f5f9").lineWidth(0.5).stroke();
      }
    });

    y = startY + Math.ceil(fields.length / 2) * 60 + 16;

    // ── Price block ───────────────────────────────────────────────
    doc.roundedRect(infoX, y, cardW - 64, 76, 10).fill("#f0fdfa");

    this.font(doc, false).fontSize(9).fillColor("#0d9488")
      .text("ИТОГО ОПЛАЧЕНО", infoX + 20, y + 14);
    this.font(doc, true).fontSize(30).fillColor("#0f172a")
      .text(`$${data.totalPriceUsd}`, infoX + 20, y + 28);

    const paidDate = `Оплачено: ${this.formatDate(data.paidAt)}`;
    this.font(doc, false).fontSize(10).fillColor("#64748b")
      .text(paidDate, W - MARGIN - 200, y + 34, { width: 155 - 32, align: "right" });

    y += 96;

    // ── Full booking ID ───────────────────────────────────────────
    this.font(doc, false).fontSize(9).fillColor("#94a3b8")
      .text(`ID заявки: ${data.bookingId}`, infoX, y, { width: cardW - 64, align: "center" });

    y += 20;

    // ── Footer ────────────────────────────────────────────────────
    const footerY = cardY + cardH - 60;
    doc.moveTo(infoX, footerY).lineTo(W - MARGIN - 32, footerY).strokeColor("#e2e8f0").lineWidth(1).stroke();

    this.font(doc, false).fontSize(9).fillColor("#94a3b8")
      .text(
        "Данный документ является подтверждением бронирования. Предъявите его вместе с паспортом.",
        infoX, footerY + 12, { width: cardW - 64, align: "center" },
      )
      .text(
        `Сформировано: ${new Date().toLocaleDateString("ru-RU")} · Tours Platform`,
        infoX, footerY + 30, { width: cardW - 64, align: "center" },
      );
  }

  private formatDate(isoOrDate: string): string {
    try {
      return new Date(isoOrDate).toLocaleDateString("ru-RU", {
        day: "2-digit", month: "long", year: "numeric",
      });
    } catch {
      return isoOrDate;
    }
  }
}
