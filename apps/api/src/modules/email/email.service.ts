import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.fromAddress = this.config.get<string>("MAIL_FROM") ?? "Tours <no-reply@tours.local>";
  }

  async onModuleInit(): Promise<void> {
    const host = this.config.get<string>("MAIL_HOST");
    if (!host) {
      this.logger.warn(
        "MAIL_HOST not set — emails will be logged to console (no SMTP transport configured).",
      );
      return;
    }

    const port = Number(this.config.get<string>("MAIL_PORT") ?? 587);
    const secure = String(this.config.get<string>("MAIL_SECURE") ?? "false").toLowerCase() === "true";
    const user = this.config.get<string>("MAIL_USER");
    const pass = this.config.get<string>("MAIL_PASS");

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
    this.logger.log(`SMTP transport created (${host}:${port}, secure=${secure}, user=${user})`);

    // Verify в фоне — не блокируем bootstrap (важно для Render free).
    this.transporter
      .verify()
      .then(() => this.logger.log(`SMTP transport verified ✓ (${host}:${port})`))
      .catch((err) => this.logger.error(`SMTP verify failed: ${(err as Error).message}`));
  }

  async send(payload: EmailPayload): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[EMAIL DEV-LOG] To: ${payload.to} | Subject: ${payload.subject}\n--- HTML ---\n${payload.html.slice(0, 500)}\n---`,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      this.logger.log(`Email sent to ${payload.to} (messageId=${info.messageId})`);
    } catch (err) {
      this.logger.error(`Email send failed to ${payload.to}: ${(err as Error).message}`);
    }
  }

  async sendOtp(to: string, code: string): Promise<void> {
    await this.send({
      to,
      subject: "Ваш код подтверждения — Tours",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:40px 24px">
          <h2 style="color:#0d9488;margin:0 0 8px">Tours</h2>
          <p style="color:#1e293b;font-size:16px;margin:0 0 20px">Ваш код подтверждения:</p>
          <div style="font-size:40px;font-weight:700;letter-spacing:12px;color:#0f172a;text-align:center;padding:24px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0 0 20px">
            ${escapeHtml(code)}
          </div>
          <p style="color:#64748b;font-size:14px;margin:0 0 8px">Код действителен <strong>10 минут</strong>. Не передавайте его никому.</p>
          <p style="color:#94a3b8;font-size:13px;margin:0">Если вы не запрашивали этот код — просто проигнорируйте письмо.</p>
        </div>
      `,
    });
  }

  async sendWelcome(to: string, fullName: string, referralCode: string, locale = "ru"): Promise<void> {
    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    await this.send({
      to,
      subject: "Добро пожаловать в Tours!",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#1e40af">Привет, ${escapeHtml(fullName)}!</h2>
          <p>Спасибо за регистрацию на платформе <strong>Tours</strong>.</p>
          <p>Ваш реферальный код: <code style="background:#f4f4f5;padding:4px 8px;border-radius:4px;font-size:14px">${escapeHtml(referralCode)}</code></p>
          <p>Приглашайте друзей по ссылке и получайте бесплатные туры:</p>
          <p><a href="${appUrl}/${locale}/tours?ref=${encodeURIComponent(referralCode)}" style="display:inline-block;background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">Моя реферальная ссылка</a></p>
          <p style="color:#6b7280;font-size:13px;margin-top:30px">С уважением, команда Tours</p>
        </div>
      `,
    });
  }

  async sendBookingReceived(
    to: string,
    contactName: string,
    tourTitle: string,
    totalPrice: number,
    options?: { bookingId?: string; isGuest?: boolean; locale?: string; contactPhone?: string; roomType?: string; notes?: string },
  ): Promise<void> {
    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    const locale = options?.locale ?? "ru";

    const registerCta = options?.isGuest
      ? `
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:16px;margin:24px 0">
          <p style="margin:0 0 8px;font-weight:600;color:#065f46">Зарегистрируйтесь — следите за заявкой в личном кабинете</p>
          <p style="margin:0 0 12px;color:#047857;font-size:14px">
            Так вы будете видеть статус, сможете оставить отзыв после поездки, и получите свою реферальную ссылку.
          </p>
          <a href="${appUrl}/${encodeURIComponent(locale)}/register?email=${encodeURIComponent(to)}&name=${encodeURIComponent(contactName)}${options.contactPhone ? `&phone=${encodeURIComponent(options.contactPhone)}` : ""}${options.bookingId ? `&bookingId=${encodeURIComponent(options.bookingId)}` : ""}"
            style="display:inline-block;background:#059669;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Зарегистрироваться
          </a>
        </div>`
      : "";

    const roomRow = options?.roomType
      ? `<tr><td style="color:#6b7280;padding:6px 0">Тип размещения</td><td style="font-weight:600;padding:6px 0 6px 16px">${escapeHtml(options.roomType)}</td></tr>`
      : "";
    const notesRow = options?.notes
      ? `<tr><td style="color:#6b7280;padding:6px 0;vertical-align:top">Примечание</td><td style="padding:6px 0 6px 16px">${escapeHtml(options.notes)}</td></tr>`
      : "";

    await this.send({
      to,
      subject: `Заявка на тур "${tourTitle}" получена`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#059669">Спасибо, ${escapeHtml(contactName)}!</h2>
          <p>Мы получили вашу заявку на тур <strong>${escapeHtml(tourTitle)}</strong>.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0;background:#f9fafb;border-radius:8px;padding:12px">
            <tr><td style="color:#6b7280;padding:6px 0">Сумма к оплате</td><td style="font-weight:600;padding:6px 0 6px 16px">$${totalPrice}</td></tr>
            ${roomRow}
            ${notesRow}
          </table>
          <p>Менеджер свяжется с вами в течение 1 часа для уточнения деталей.</p>
          ${registerCta}
          <p style="color:#6b7280;font-size:13px;margin-top:30px">Команда Tours</p>
        </div>
      `,
    });
  }

  async sendBookingStatusChanged(to: string, contactName: string, tourTitle: string, newStatus: string): Promise<void> {
    const statusLabel: Record<string, string> = {
      IN_PROGRESS: "🔄 В работе у менеджера",
      PAID: "✅ Оплачена! Ждём вас в путешествии",
      COMPLETED: "🎉 Завершена. Спасибо, что были с нами!",
      CANCELLED: "❌ Отменена",
    };
    await this.send({
      to,
      subject: `Статус заявки изменён: ${tourTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2>Привет, ${escapeHtml(contactName)}!</h2>
          <p>Статус вашей заявки на тур <strong>${escapeHtml(tourTitle)}</strong> изменился:</p>
          <p style="font-size:18px;font-weight:600;color:#2563eb">${statusLabel[newStatus] ?? newStatus}</p>
          <p style="color:#6b7280;font-size:13px;margin-top:30px">Команда Tours</p>
        </div>
      `,
    });
  }

  async sendPartnerWelcome(to: string, fullName: string, tempPassword: string): Promise<void> {
    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    await this.send({
      to,
      subject: "Вас добавили партнёром Tours",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#0d9488">Привет, ${escapeHtml(fullName)}!</h2>
          <p>Команда Tours добавила вас в партнёрскую программу.</p>
          <p>Теперь вы можете приглашать клиентов по своей реферальной ссылке и получать 5% с каждой оплаченной заявки.</p>
          <div style="background:#f4f4f5;padding:16px;border-radius:8px;margin:20px 0">
            <p style="margin:0 0 8px"><strong>Email для входа:</strong> ${escapeHtml(to)}</p>
            <p style="margin:0"><strong>Временный пароль:</strong> <code style="background:#fff;padding:4px 8px;border-radius:4px;font-size:14px;letter-spacing:1px">${escapeHtml(tempPassword)}</code></p>
          </div>
          <p>После входа обязательно смените пароль в личном кабинете.</p>
          <p><a href="${appUrl}/ru/login" style="display:inline-block;background:#0d9488;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">Войти в кабинет</a></p>
          <p style="color:#6b7280;font-size:13px;margin-top:30px">Если вы не ожидали это письмо — просто проигнорируйте его. С уважением, команда Tours.</p>
        </div>
      `,
    });
  }

  async sendPartnerPasswordReset(to: string, fullName: string, tempPassword: string): Promise<void> {
    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    await this.send({
      to,
      subject: "Tours — новый пароль партнёра",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2>Привет, ${escapeHtml(fullName)}!</h2>
          <p>Администратор сбросил ваш пароль. Используйте новый временный пароль для входа:</p>
          <div style="background:#f4f4f5;padding:16px;border-radius:8px;margin:20px 0">
            <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(to)}</p>
            <p style="margin:0"><strong>Новый пароль:</strong> <code style="background:#fff;padding:4px 8px;border-radius:4px;font-size:14px;letter-spacing:1px">${escapeHtml(tempPassword)}</code></p>
          </div>
          <p>После входа сразу смените пароль в личном кабинете.</p>
          <p><a href="${appUrl}/ru/login" style="display:inline-block;background:#0d9488;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">Войти</a></p>
          <p style="color:#6b7280;font-size:13px;margin-top:30px">Если это не вы — срочно свяжитесь с поддержкой. Команда Tours.</p>
        </div>
      `,
    });
  }

  async sendDocumentsRequested(
    to: string,
    contactName: string,
    tourTitle: string,
    bookingId: string,
    note?: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    const noteBlock = note
      ? `<p style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:12px 16px;margin:16px 0;color:#713f12">${escapeHtml(note)}</p>`
      : "";
    await this.send({
      to,
      subject: `Требуются документы для тура "${tourTitle}"`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#0d9488">Привет, ${escapeHtml(contactName)}!</h2>
          <p>Ваш менеджер запросил документы для оформления тура <strong>${escapeHtml(tourTitle)}</strong>.</p>
          ${noteBlock}
          <p>Пожалуйста, войдите в личный кабинет и загрузите необходимые документы (паспорт, загранпаспорт).</p>
          <p><a href="${appUrl}/ru/dashboard/trips/${encodeURIComponent(bookingId)}"
            style="display:inline-block;background:#0d9488;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Открыть заявку и загрузить документы
          </a></p>
          <p style="color:#6b7280;font-size:13px;margin-top:30px">Команда Tours</p>
        </div>
      `,
    });
  }

  async sendDocumentsSubmitted(
    to: string,
    clientName: string,
    tourTitle: string,
    bookingId: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    await this.send({
      to,
      subject: `Документы загружены — ${tourTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2>Новые документы по заявке</h2>
          <p>Клиент <strong>${escapeHtml(clientName)}</strong> загрузил документы для тура <strong>${escapeHtml(tourTitle)}</strong>.</p>
          <p>Зайдите в административную панель и подтвердите или отклоните документы.</p>
          <p><a href="${appUrl}/ru/admin/bookings/${encodeURIComponent(bookingId)}"
            style="display:inline-block;background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Открыть в админке
          </a></p>
        </div>
      `,
    });
  }

  async sendDocumentsConfirmed(
    to: string,
    contactName: string,
    tourTitle: string,
    bookingId: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    await this.send({
      to,
      subject: `Документы приняты — тур "${tourTitle}"`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#059669">Привет, ${escapeHtml(contactName)}!</h2>
          <p>Ваши документы для тура <strong>${escapeHtml(tourTitle)}</strong> проверены и приняты. Менеджер приступает к оформлению.</p>
          <p><a href="${appUrl}/ru/dashboard/trips/${encodeURIComponent(bookingId)}"
            style="display:inline-block;background:#059669;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Открыть мою заявку
          </a></p>
          <p style="color:#6b7280;font-size:13px;margin-top:30px">Команда Tours</p>
        </div>
      `,
    });
  }

  async sendDocumentsRejected(
    to: string,
    contactName: string,
    tourTitle: string,
    bookingId: string,
    rejectionNote: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    await this.send({
      to,
      subject: `Документы отклонены — тур "${tourTitle}"`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2>Привет, ${escapeHtml(contactName)}!</h2>
          <p>К сожалению, документы по туру <strong>${escapeHtml(tourTitle)}</strong> не были приняты.</p>
          <p style="font-weight:600">Причина:</p>
          <p style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;color:#7f1d1d">${escapeHtml(rejectionNote)}</p>
          <p>Пожалуйста, загрузите исправленные документы в личном кабинете.</p>
          <p><a href="${appUrl}/ru/dashboard/trips/${encodeURIComponent(bookingId)}"
            style="display:inline-block;background:#dc2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Открыть заявку и загрузить заново
          </a></p>
          <p style="color:#6b7280;font-size:13px;margin-top:30px">Команда Tours</p>
        </div>
      `,
    });
  }

  async sendReferralRewarded(
    to: string, fullName: string, type: "client" | "partner", details: { count?: number; threshold?: number; commission?: number; freeTour?: boolean },
  ): Promise<void> {
    const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    let body = "";
    let subject = "";
    if (type === "client") {
      const remaining = (details.threshold ?? 50) - (details.count ?? 0);
      if (details.freeTour) {
        subject = "🎉 Вы заработали бесплатный тур!";
        body = `<p style="font-size:18px">Поздравляем! Вы привели <strong>${details.count}</strong> друзей и получили <strong>+1 бесплатный тур</strong>.</p>`;
      } else {
        subject = `+1 реферал! Осталось ${remaining}`;
        body = `<p>По вашей ссылке только что был оплачен тур. У вас уже <strong>${details.count}/${details.threshold}</strong>. Осталось ещё ${remaining} приглашений до бесплатного тура.</p>`;
      }
    } else {
      subject = `+$${details.commission} на ваш баланс`;
      body = `<p>По вашей реферальной ссылке только что был оплачен тур. Вам начислено <strong>$${details.commission}</strong> (5% комиссия).</p>`;
    }

    await this.send({
      to,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2>Привет, ${escapeHtml(fullName)}!</h2>
          ${body}
          <p><a href="${appUrl}" style="display:inline-block;background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">Открыть личный кабинет</a></p>
          <p style="color:#6b7280;font-size:13px;margin-top:30px">Команда Tours</p>
        </div>
      `,
    });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
