import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { Prisma, BookingStatus, UserRole, TransactionType } from "@tours/db";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { ListBookingsDto } from "./dto/list-bookings.dto";

interface BookingContext {
  userId?: string;
  referralCode?: string;
  ip?: string;
}

const PARTNER_COMMISSION_RATE = 0.05;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async create(dto: CreateBookingDto, ctx: BookingContext) {
    const tour = await this.prisma.tour.findUnique({ where: { id: dto.tourId } });
    if (!tour || !tour.isActive) {
      throw new BadRequestException("Tour not found or inactive");
    }

    let referrerId: string | null = null;
    if (ctx.referralCode) {
      const code = ctx.referralCode.trim().toUpperCase();
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: code }, select: { id: true, isActive: true, role: true },
      });
      if (referrer && referrer.isActive && referrer.role !== UserRole.ADMIN && referrer.id !== ctx.userId) {
        const normalizedEmail = dto.contactEmail.trim().toLowerCase();
        const earlierByEmail = await this.prisma.booking.findFirst({
          where: { contactEmail: normalizedEmail, referrerId: { not: null } },
          select: { referrerId: true },
        });
        if (earlierByEmail && earlierByEmail.referrerId && earlierByEmail.referrerId !== referrer.id) {
          this.logger.warn(`Anti-fraud: email=${normalizedEmail} already linked to another referrer`);
        } else {
          referrerId = referrer.id;
        }
      }
    }

    const totalPriceUsd = new Prisma.Decimal(tour.priceUsd).mul(dto.guestsCount ?? 1);

    const booking = await this.prisma.booking.create({
      data: {
        tourId: dto.tourId,
        userId: ctx.userId ?? null,
        contactName: dto.contactName.trim(),
        contactEmail: dto.contactEmail.trim().toLowerCase(),
        contactPhone: dto.contactPhone.trim(),
        guestsCount: dto.guestsCount ?? 1,
        preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
        roomType: dto.roomType ?? null,
        notes: dto.notes || null,
        totalPriceUsd,
        referrerId,
        referralCookieAt: referrerId ? new Date() : null,
        referralIp: referrerId ? ctx.ip : null,
        status: BookingStatus.NEW,
      },
    });

    this.logger.log(
      `Booking created: ${booking.id}, tour=${tour.slug}, ref=${referrerId ?? "none"}`,
    );

    // Email клиенту "заявка получена".
    // Для гостей (userId === null) — добавляем кнопку регистрации с pre-fill email
    // и bookingId, чтобы после регистрации заявка привязалась к новому аккаунту.
    const tourTitleRu = (tour.title as { ru?: string }).ru ?? tour.slug;
    const isGuest = !ctx.userId;
    void this.email.sendBookingReceived(
      booking.contactEmail,
      booking.contactName,
      tourTitleRu,
      Number(totalPriceUsd),
      {
        bookingId: booking.id,
        isGuest,
        contactPhone: booking.contactPhone ?? undefined,
        roomType: dto.roomType,
        notes: dto.notes,
      },
    ).catch(() => undefined);

    return this.serialize(booking);
  }

  async listMy(userId: string, query: ListBookingsDto) {
    const where: Prisma.BookingWhereInput = { userId };
    if (query.status) where.status = query.status;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where, orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize, take: pageSize,
        include: {
          tour: { select: { id: true, slug: true, title: true, coverImage: true, country: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return {
      items: items.map((b) => ({ ...this.serialize(b), tour: b.tour })),
      total, page, pageSize,
    };
  }

  async listAll(query: ListBookingsDto) {
    const where: Prisma.BookingWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { contactEmail: { contains: query.search, mode: "insensitive" } },
        { contactPhone: { contains: query.search } },
        { contactName: { contains: query.search, mode: "insensitive" } },
      ];
    }
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where, orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize, take: pageSize,
        include: {
          tour: { select: { id: true, slug: true, title: true, coverImage: true, country: true } },
          user: { select: { id: true, email: true, fullName: true } },
          referrer: { select: { id: true, email: true, fullName: true, role: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return {
      items: items.map((b) => ({
        ...this.serialize(b),
        tour: b.tour, user: b.user, referrer: b.referrer,
      })),
      total, page, pageSize,
    };
  }

  async getById(id: string, requester: { id: string; role: UserRole }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        tour: true,
        user: { select: { id: true, email: true, fullName: true } },
      },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (requester.role !== UserRole.ADMIN && booking.userId !== requester.id) {
      throw new ForbiddenException("Access denied");
    }
    return { ...this.serialize(booking), tour: booking.tour, user: booking.user };
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto, adminId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id }, include: { tour: { select: { title: true, slug: true, referralThreshold: true } } },
    });
    if (!booking) throw new NotFoundException("Booking not found");

    const isNewlyPaid = dto.status === BookingStatus.PAID && booking.status !== BookingStatus.PAID;
    const statusChanged = dto.status !== booking.status;

    const result = await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.BookingUpdateInput = {
        status: dto.status,
        statusChangedAt: new Date(),
        managerId: adminId,
      };
      if (dto.managerNotes !== undefined) updateData.managerNotes = dto.managerNotes;
      if (dto.status === BookingStatus.PAID && !booking.paidAt) updateData.paidAt = new Date();
      if (dto.status === BookingStatus.COMPLETED && !booking.completedAt) updateData.completedAt = new Date();
      if (dto.status === BookingStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
        if (dto.cancelReason) updateData.cancelReason = dto.cancelReason;
      }
      const updated = await tx.booking.update({ where: { id }, data: updateData });

      let rewardInfo: { type: "client" | "partner"; details: { count?: number; threshold?: number; commission?: number; freeTour?: boolean } } | null = null;
      let referrerEmail: string | null = null;
      let referrerName: string | null = null;

      if (isNewlyPaid && booking.referrerId) {
        rewardInfo = await this.applyReferralReward(tx, booking.id, booking.referrerId, booking.tourId, booking.totalPriceUsd, adminId);
        if (rewardInfo) {
          const referrer = await tx.user.findUnique({
            where: { id: booking.referrerId }, select: { email: true, fullName: true },
          });
          referrerEmail = referrer?.email ?? null;
          referrerName = referrer?.fullName ?? null;
        }
      }
      return { booking: updated, rewardInfo, referrerEmail, referrerName };
    });

    const tourTitleRu = (booking.tour.title as { ru?: string }).ru ?? booking.tour.slug;
    if (statusChanged) {
      void this.email.sendBookingStatusChanged(
        booking.contactEmail, booking.contactName, tourTitleRu, dto.status,
      ).catch(() => undefined);
    }
    if (result.rewardInfo && result.referrerEmail && result.referrerName) {
      void this.email.sendReferralRewarded(
        result.referrerEmail, result.referrerName, result.rewardInfo.type, result.rewardInfo.details,
      ).catch(() => undefined);
    }

    return this.serialize(result.booking);
  }

  private async applyReferralReward(
    tx: Prisma.TransactionClient,
    bookingId: string,
    referrerId: string,
    tourId: string,
    totalPriceUsd: Prisma.Decimal,
    adminId: string,
  ): Promise<{ type: "client" | "partner"; details: { count?: number; threshold?: number; commission?: number; freeTour?: boolean } } | null> {
    const referrer = await tx.user.findUnique({
      where: { id: referrerId },
      select: { id: true, role: true, referralCount: true, isActive: true },
    });
    if (!referrer || !referrer.isActive) {
      this.logger.warn(`Reward skipped: referrer ${referrerId} not found or inactive`);
      return null;
    }

    if (referrer.role === UserRole.ADMIN) {
      this.logger.warn(`Reward blocked: referrer ${referrerId} is ADMIN — self-dealing prevention`);
      return null;
    }

    if (referrer.role === UserRole.CLIENT) {
      const tour = await tx.tour.findUnique({
        where: { id: tourId }, select: { referralThreshold: true },
      });
      const threshold = tour?.referralThreshold ?? 50;
      const newCount = referrer.referralCount + 1;
      const earnedFreeTour = newCount >= threshold && referrer.referralCount < threshold;

      await tx.user.update({
        where: { id: referrerId },
        data: {
          referralCount: { increment: 1 },
          ...(earnedFreeTour ? { freeToursAvailable: { increment: 1 } } : {}),
        },
      });
      await tx.transaction.create({
        data: {
          userId: referrerId,
          type: TransactionType.REFERRAL_COUNT,
          amountUsd: 0,
          increment: 1,
          bookingId,
          performedBy: adminId,
          description: earnedFreeTour
            ? `+1 реферал (${newCount}/${threshold}). Достигнут порог! +1 бесплатный тур.`
            : `+1 реферал (${newCount}/${threshold}).`,
        },
      });

      this.logger.log(
        `Reward (CLIENT): user=${referrerId}, +1 → ${newCount}/${threshold}` +
          (earnedFreeTour ? " 🎉 free tour earned!" : ""),
      );
      return { type: "client", details: { count: newCount, threshold, freeTour: earnedFreeTour } };
    }

    if (referrer.role === UserRole.PARTNER) {
      const commission = totalPriceUsd.mul(PARTNER_COMMISSION_RATE);
      await tx.user.update({
        where: { id: referrerId },
        data: { balance: { increment: commission } },
      });
      await tx.transaction.create({
        data: {
          userId: referrerId,
          type: TransactionType.COMMISSION_EARNED,
          amountUsd: commission,
          increment: 0,
          bookingId,
          performedBy: adminId,
          description: `Комиссия 5% с заявки $${totalPriceUsd}`,
        },
      });
      this.logger.log(`Reward (PARTNER): user=${referrerId}, +$${commission}`);
      return { type: "partner", details: { commission: Number(commission) } };
    }

    this.logger.warn(`Reward skipped: referrer ${referrerId} has unsupported role=${referrer.role}`);
    return null;
  }

  private serialize(b: {
    id: string; tourId: string; userId: string | null;
    contactName: string; contactEmail: string; contactPhone: string;
    guestsCount: number; preferredDate: Date | null;
    roomType: string | null; notes: string | null;
    totalPriceUsd: Prisma.Decimal;
    status: BookingStatus;
    referrerId: string | null;
    paidAt: Date | null; completedAt: Date | null; cancelledAt: Date | null;
    createdAt: Date; updatedAt: Date;
  }) {
    return {
      id: b.id, tourId: b.tourId, userId: b.userId,
      contactName: b.contactName, contactEmail: b.contactEmail, contactPhone: b.contactPhone,
      guestsCount: b.guestsCount,
      preferredDate: b.preferredDate?.toISOString() ?? null,
      roomType: b.roomType,
      notes: b.notes,
      totalPriceUsd: Number(b.totalPriceUsd),
      status: b.status,
      referrerId: b.referrerId,
      paidAt: b.paidAt?.toISOString() ?? null,
      completedAt: b.completedAt?.toISOString() ?? null,
      cancelledAt: b.cancelledAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    };
  }
}
