import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { BookingStatus, UserRole } from "@tours/db";
import { TrackClickDto } from "./dto/track-click.dto";

interface ClickContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Записать клик по реф-ссылке. */
  async trackClick(dto: TrackClickDto, ctx: ClickContext) {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: dto.referralCode },
      select: { id: true, isActive: true, role: true },
    });
    if (!referrer || !referrer.isActive || referrer.role === UserRole.ADMIN) return { ok: false };

    let tourId: string | null = null;
    if (dto.tourSlug) {
      const tour = await this.prisma.tour.findUnique({
        where: { slug: dto.tourSlug }, select: { id: true },
      });
      if (tour) tourId = tour.id;
    }

    await this.prisma.referralClick.create({
      data: {
        referrerId: referrer.id,
        tourId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        fingerprint: dto.fingerprint,
      },
    });
    return { ok: true };
  }

  /** Статистика для текущего пользователя (CLIENT или PARTNER). */
  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, role: true, referralCode: true,
        referralCount: true, freeToursAvailable: true,
        balance: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");

    const [clicks, registrations, paidBookings, pendingBookings] = await Promise.all([
      this.prisma.referralClick.count({ where: { referrerId: user.id } }),
      this.prisma.user.count({ where: { referrerId: user.id } }),
      this.prisma.booking.count({
        where: {
          referrerId: user.id,
          status: { in: [BookingStatus.PAID, BookingStatus.COMPLETED] },
        },
      }),
      this.prisma.booking.count({
        where: { referrerId: user.id, status: { in: [BookingStatus.NEW, BookingStatus.IN_PROGRESS] } },
      }),
    ]);

    // Средний порог для бесплатного тура — берём из самого популярного тура (или 50)
    const tour = await this.prisma.tour.findFirst({
      where: { isActive: true },
      orderBy: { reviewsCount: "desc" },
      select: { referralThreshold: true },
    });
    const threshold = tour?.referralThreshold ?? 50;

    const progressPercent = Math.min(100, Math.round((user.referralCount / threshold) * 100));

    return {
      role: user.role,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      freeToursAvailable: user.freeToursAvailable,
      balance: Number(user.balance),

      clicks,
      registrations,
      paidBookings,
      pendingBookings,

      threshold,
      progressPercent,
      remaining: Math.max(0, threshold - user.referralCount),

      conversionRate: clicks > 0 ? Number((paidBookings / clicks * 100).toFixed(2)) : 0,
    };
  }

  /** Расширенная статистика для PARTNER — данные по дням за последние 30 дней. */
  async getPartnerStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, balance: true, referralCode: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const since = new Date();
    since.setDate(since.getDate() - 30);

    // Группировка по дням через raw — Prisma пока не умеет date_trunc нативно
    const clicksByDay = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "created_at") AS day, COUNT(*)::bigint AS count
      FROM referral_clicks
      WHERE "referrer_id" = ${user.id} AND "created_at" >= ${since}
      GROUP BY day ORDER BY day
    `;

    const regsByDay = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "created_at") AS day, COUNT(*)::bigint AS count
      FROM users
      WHERE "referrer_id" = ${user.id} AND "created_at" >= ${since}
      GROUP BY day ORDER BY day
    `;

    // Считаем оплаченными как PAID, так и COMPLETED заявки: завершённая поездка
    // тоже была оплачена (комиссия уже начислена при переходе в PAID). Иначе после
    // перевода менеджером PAID → COMPLETED продажа выпадает из статистики.
    const salesByDay = await this.prisma.$queryRaw<{ day: Date; count: bigint; total_amount: number }[]>`
      SELECT date_trunc('day', "paid_at") AS day,
             COUNT(*)::bigint AS count,
             COALESCE(SUM("total_price_usd"), 0)::float AS total_amount
      FROM bookings
      WHERE "referrer_id" = ${user.id}
        AND "status" IN ('PAID', 'COMPLETED')
        AND "paid_at" IS NOT NULL
        AND "paid_at" >= ${since}
      GROUP BY day ORDER BY day
    `;

    const totals = {
      totalClicks: clicksByDay.reduce((s, r) => s + Number(r.count), 0),
      totalRegistrations: regsByDay.reduce((s, r) => s + Number(r.count), 0),
      totalPaidBookings: salesByDay.reduce((s, r) => s + Number(r.count), 0),
      totalRevenue: salesByDay.reduce((s, r) => s + Number(r.total_amount), 0),
      totalCommission: 0,
    };
    totals.totalCommission = Number((totals.totalRevenue * 0.05).toFixed(2));

    const transactions = await this.prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      role: user.role,
      balance: Number(user.balance),
      referralCode: user.referralCode,
      totals,
      timeline: {
        clicks: clicksByDay.map((r) => ({ day: r.day.toISOString().slice(0, 10), count: Number(r.count) })),
        registrations: regsByDay.map((r) => ({ day: r.day.toISOString().slice(0, 10), count: Number(r.count) })),
        sales: salesByDay.map((r) => ({
          day: r.day.toISOString().slice(0, 10),
          count: Number(r.count),
          amount: Number(r.total_amount),
        })),
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amountUsd: Number(t.amountUsd),
        increment: t.increment,
        description: t.description,
        bookingId: t.bookingId,
        payoutId: t.payoutId,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }
}
