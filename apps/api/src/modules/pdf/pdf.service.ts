import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as puppeteer from "puppeteer";

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
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
  }

  async generateTicket(data: TicketData): Promise<Buffer> {
    const html = this.buildHtml(data);

    const executablePath = this.config.get<string>("PUPPETEER_EXECUTABLE_PATH");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      ...(executablePath ? { executablePath } : {}),
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private fmt(iso: string | null): string {
    if (!iso) return "Уточняется";
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  private shortId(): string {
    return ""; // placeholder — not used in template directly
  }

  private buildHtml(d: TicketData): string {
    const shortId = d.bookingId.slice(0, 8).toUpperCase();
    const ticketUrl = `${this.appUrl}/ru/dashboard/trips/${d.bookingId}`;

    // QR code via Google Charts API (no external JS needed, just an <img>)
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(ticketUrl)}&size=160x160&margin=4&color=0f172a&bgcolor=ffffff`;

    const location = [d.country, d.city].filter(Boolean).join(" · ");

    return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f1f5f9;
    width: 210mm;
    min-height: 297mm;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 20mm 15mm;
  }

  .ticket {
    width: 100%;
    background: #ffffff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 40px rgba(0,0,0,0.10);
  }

  /* ── Header ── */
  .header {
    background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
    padding: 28px 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header-left .brand {
    font-size: 32px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -1px;
  }
  .header-left .subtitle {
    font-size: 11px;
    font-weight: 500;
    color: rgba(255,255,255,0.65);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-top: 4px;
  }
  .header-right {
    text-align: right;
  }
  .header-right .label {
    font-size: 9px;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .header-right .booking-id {
    font-size: 22px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 2px;
    margin-top: 2px;
  }

  /* ── Status stripe ── */
  .status-stripe {
    background: #ecfdf5;
    border-bottom: 1px solid #d1fae5;
    padding: 10px 36px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #10b981;
  }
  .status-text {
    font-size: 12px;
    font-weight: 600;
    color: #065f46;
    letter-spacing: 0.05em;
  }
  .status-date {
    margin-left: auto;
    font-size: 11px;
    color: #6b7280;
  }

  /* ── Body ── */
  .body {
    padding: 32px 36px;
    display: flex;
    gap: 32px;
    align-items: flex-start;
  }
  .body-left { flex: 1; min-width: 0; }
  .body-right { width: 180px; shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 10px; }

  /* Tour title */
  .section-label {
    font-size: 9px;
    font-weight: 700;
    color: #0d9488;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .tour-title {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    letter-spacing: -0.5px;
  }
  .tour-location {
    margin-top: 6px;
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }

  /* Divider */
  .divider {
    border: none;
    border-top: 1px dashed #e2e8f0;
    margin: 24px 0;
    position: relative;
  }

  /* Fields grid */
  .fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px 28px;
    margin-top: 24px;
  }
  .field-label {
    font-size: 9px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .field-value {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
    word-break: break-all;
  }
  .field-value.muted {
    font-weight: 500;
    color: #475569;
  }

  /* QR block */
  .qr-wrapper {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .qr-wrapper img { display: block; border-radius: 4px; }
  .qr-hint {
    font-size: 10px;
    color: #94a3b8;
    text-align: center;
    line-height: 1.4;
    max-width: 150px;
  }

  /* ── Price block ── */
  .price-block {
    margin: 0 36px 28px;
    background: #f0fdfa;
    border: 1px solid #99f6e4;
    border-radius: 14px;
    padding: 20px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .price-label {
    font-size: 9px;
    font-weight: 700;
    color: #0d9488;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .price-value {
    font-size: 36px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -1.5px;
  }
  .price-meta {
    text-align: right;
    font-size: 12px;
    color: #64748b;
    line-height: 1.8;
  }

  /* ── Full ID ── */
  .booking-full-id {
    margin: 0 36px 20px;
    font-size: 10px;
    color: #cbd5e1;
    letter-spacing: 0.05em;
    text-align: center;
  }

  /* ── Footer ── */
  .footer {
    background: #f8fafc;
    border-top: 1px dashed #e2e8f0;
    padding: 16px 36px;
    text-align: center;
  }
  .footer-text {
    font-size: 10px;
    color: #94a3b8;
    line-height: 1.7;
  }
  .footer-brand {
    font-size: 10px;
    font-weight: 600;
    color: #cbd5e1;
    margin-top: 4px;
    letter-spacing: 0.1em;
  }
</style>
</head>
<body>
<div class="ticket">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="brand">Tours</div>
      <div class="subtitle">Подтверждение бронирования</div>
    </div>
    <div class="header-right">
      <div class="label">Заявка</div>
      <div class="booking-id">#${shortId}</div>
    </div>
  </div>

  <!-- Status -->
  <div class="status-stripe">
    <div class="status-dot"></div>
    <span class="status-text">✅ Оплата подтверждена — готовимся к поездке!</span>
    <span class="status-date">Оплачено: ${this.fmt(d.paidAt)}</span>
  </div>

  <!-- Main body -->
  <div class="body">
    <div class="body-left">

      <div class="section-label">Тур</div>
      <div class="tour-title">${d.tourTitle}</div>
      <div class="tour-location">📍 ${location}${d.durationDays ? ` · ${d.durationDays} дн.` : ""}</div>

      <div class="divider"></div>

      <div class="fields">
        <div>
          <div class="field-label">Турист</div>
          <div class="field-value">${d.contactName}</div>
        </div>
        <div>
          <div class="field-label">Гостей</div>
          <div class="field-value">${d.guestsCount} чел.</div>
        </div>
        <div>
          <div class="field-label">Email</div>
          <div class="field-value muted">${d.contactEmail}</div>
        </div>
        <div>
          <div class="field-label">Телефон</div>
          <div class="field-value muted">${d.contactPhone}</div>
        </div>
        <div>
          <div class="field-label">Дата тура</div>
          <div class="field-value">${this.fmt(d.preferredDate)}</div>
        </div>
        <div>
          <div class="field-label">Отель</div>
          <div class="field-value">${d.hotelName ?? "Уточняется"}</div>
        </div>
      </div>

    </div>

    <div class="body-right">
      <div class="qr-wrapper">
        <img src="${qrSrc}" width="156" height="156" alt="QR" />
      </div>
      <div class="qr-hint">Сканируйте для открытия заявки на сайте</div>
    </div>
  </div>

  <!-- Price -->
  <div class="price-block">
    <div>
      <div class="price-label">Итого оплачено</div>
      <div class="price-value">$${d.totalPriceUsd}</div>
    </div>
    <div class="price-meta">
      <div>Дата оплаты: <strong>${this.fmt(d.paidAt)}</strong></div>
      <div>Заявка: <strong>#${shortId}</strong></div>
    </div>
  </div>

  <!-- Full booking ID -->
  <div class="booking-full-id">ID: ${d.bookingId}</div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-text">
      Данный документ является официальным подтверждением бронирования.<br />
      Предъявите его вместе с документом, удостоверяющим личность.
    </div>
    <div class="footer-brand">
      Сформировано: ${new Date().toLocaleDateString("ru-RU")} · Tours Platform
    </div>
  </div>

</div>
</body>
</html>`;
  }
}
