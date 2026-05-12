import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

interface ResendResponse {
  id?: string;
  error?: { message: string };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resendApiKey: string | undefined;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.resendApiKey = this.config.get<string>("RESEND_API_KEY");
    this.fromAddress = this.config.get<string>("EMAIL_FROM") ?? "Tours <onboarding@resend.dev>";

    if (!this.resendApiKey) {
      this.logger.warn(
        "RESEND_API_KEY not set. Emails will be logged to console instead of sent (dev mode).",
      );
    }
  }

  async send(payload: EmailPayload): Promise<void> {
    if (!this.resendApiKey) {
      this.logger.log(
        `[EMAIL DEV-LOG] To: ${payload.to} | Subject: ${payload.subject}\n--- HTML ---\n${payload.html.slice(0, 500)}\n---`,
      );
      return;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });
      const data = (await response.json()) as ResendResponse;
      if (!response.ok || data.error) {
        this.logger.error(`Resend send failed: ${data.error?.message ?? response.statusText}`);
        return;
      }
      this.logger.log(`Email sent to ${payload.to}: ${data.id}`);
    } catch (err) {
      this.logger.error(`Email send exception: ${(err as Error).message}`);
    }
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

  /**
   * Письмо о принятой заявке. Для гостей (isGuest=true) добавляем CTA «Зарегистрироваться»
   * с pre-fill email и bookingId — после регистрации заявка автоматически привяжется к новому юзеру.
   */
  async sendBookingReceived(
    to: string,
    contactName: string,
    tourTitle: string,
    totalPrice: number,
    options?: { bookingId?: string; isGuest?: boolean; locale?: string },
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
          <a href="${appUrl}/${encodeURIComponent(locale)}/register?email=${encodeURIComponent(to)}${options.bookingId ? `&bookingId=${encodeURIComponent(options.bookingId)}` : ""}"
            style="display:inline-block;background:#059669;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Зарегистрироваться
          </a>
        </div>`
      : "";

    await this.send({
      to,
      subject: `Заявка на тур "${tourTitle}" получена`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#059669">Спасибо, ${escapeHtml(contactName)}!</h2>
          <p>Мы получили вашу заявку на тур <strong>${escapeHtml(tourTitle)}</strong>.</p>
          <p>Сумма: <strong>$${totalPrice}</strong></p>
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
