import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PdfService } from "../pdf/pdf.service";
import { Prisma, BookingStatus, UserRole, TransactionType, NotificationType } from "@tours/db";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { ListBookingsDto } from "./dto/list-bookings.dto";
import { RequestPaymentDto } from "./dto/request-payment.dto";

const STATUS_NOTIFICATION: Partial<Record<BookingStatus, { type: NotificationType; title: string; body: (tour: string) => string }>> = {
  [BookingStatus.IN_PROGRESS]: {
    type: NotificationType.BOOKING_ACCEPTED,
    title: "Заявка принята",
    body: (tour) => `Менеджер приступил к оформлению вашей поездки «${tour}».`,
  },
  [BookingStatus.AWAITING_PAYMENT]: {
    type: NotificationType.BOOKING_PAYMENT_REQUESTED,
    title: "Выставлен счёт на оплату",
    body: (tour) => `По заявке «${tour}» выставлен счёт. Переведите оплату и загрузите квитанцию.`,
  },
  [BookingStatus.PAID]: {
    type: NotificationType.BOOKING_PAID,
    title: "Оплата получена",
    body: (tour) => `Оплата за тур «${tour}» подтверждена. Готовимся к поездке!`,
  },
  [BookingStatus.COMPLETED]: {
    type: NotificationType.BOOKING_COMPLETED,
    title: "Поездка завершена",
    body: (tour) => `Ваша поездка «${tour}» завершена. Спасибо! Оставьте отзыв.`,
  },
  [BookingStatus.CANCELLED]: {
    type: NotificationType.BOOKING_CANCELLED,
    title: "Заявка отменена",
    body: (tour) => `К сожалению, ваша заявка на тур «${tour}» была отменена.`,
  },
};

interface BookingContext {
  userId?: string;
  referralCode?: string;
  ip?: string;
}

const DEFAULT_COMMISSION_RATE = 0.05;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly pdf: PdfService,
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
        documents: {
          where: requester.role === UserRole.ADMIN ? {} : { visibleToClient: true },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, kind: true, uploadedById: true, fileName: true,
            sizeBytes: true, mimeType: true, description: true,
            visibleToClient: true, confirmedAt: true, confirmedById: true,
            rejectionNote: true, createdAt: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
          select: { id: true, fromStatus: true, toStatus: true, changedById: true, note: true, createdAt: true },
        },
      },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (requester.role !== UserRole.ADMIN && booking.userId !== requester.id) {
      throw new ForbiddenException("Access denied");
    }
    return {
      ...this.serialize(booking),
      tour: booking.tour,
      user: booking.user,
      documents: booking.documents.map((d) => ({
        ...d,
        confirmedAt: d.confirmedAt?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
      })),
      statusHistory: booking.statusHistory.map((h) => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto, adminId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        tour: {
          select: {
            title: true, slug: true, referralThreshold: true,
            country: true, city: true, durationDays: true, hotelName: true,
          },
        },
      },
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

      if (statusChanged) {
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: id,
            fromStatus: booking.status,
            toStatus: dto.status,
            changedById: adminId,
            note: dto.managerNotes ?? null,
          },
        });
      }

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
      if (isNewlyPaid) {
        // Generate PDF ticket and send as email attachment (fire-and-forget)
        void (async () => {
          try {
            const paidAt = result.booking.paidAt ?? new Date();
            const ticketPdf = await this.pdf.generateTicket({
              bookingId: id,
              tourTitle: tourTitleRu,
              contactName: booking.contactName,
              contactEmail: booking.contactEmail,
              contactPhone: booking.contactPhone,
              guestsCount: booking.guestsCount,
              preferredDate: booking.preferredDate?.toISOString() ?? null,
              totalPriceUsd: Number(booking.totalPriceUsd),
              country: booking.tour.country,
              city: booking.tour.city ?? null,
              durationDays: booking.tour.durationDays,
              hotelName: booking.tour.hotelName ?? null,
              paidAt: paidAt.toISOString(),
            });
            await this.email.sendBookingPaid(
              booking.contactEmail, booking.contactName, tourTitleRu, id, ticketPdf,
            );
          } catch (err) {
            this.logger.error(`Failed to generate/send ticket for booking ${id}: ${(err as Error).message}`);
            // Fallback: send plain status email without PDF
            await this.email.sendBookingStatusChanged(
              booking.contactEmail, booking.contactName, tourTitleRu, dto.status,
            ).catch(() => undefined);
          }
        })();
      } else {
        void this.email.sendBookingStatusChanged(
          booking.contactEmail, booking.contactName, tourTitleRu, dto.status,
        ).catch(() => undefined);
      }

      const notifTemplate = STATUS_NOTIFICATION[dto.status];
      if (notifTemplate && booking.userId) {
        void this.notifications.create({
          userId: booking.userId,
          type: notifTemplate.type,
          title: notifTemplate.title,
          body: notifTemplate.body(tourTitleRu),
          bookingId: id,
        });
      }
    }
    if (result.rewardInfo && result.referrerEmail && result.referrerName) {
      void this.email.sendReferralRewarded(
        result.referrerEmail, result.referrerName, result.rewardInfo.type, result.rewardInfo.details,
      ).catch(() => undefined);
    }

    return this.serialize(result.booking);
  }

  async getTicketPdf(id: string, requester: { id: string; role: UserRole }): Promise<{ pdf: Buffer; filename: string }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        tour: { select: { title: true, slug: true, country: true, city: true, durationDays: true, hotelName: true } },
      },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (requester.role !== UserRole.ADMIN && booking.userId !== requester.id) {
      throw new ForbiddenException("Access denied");
    }
    if (booking.status !== BookingStatus.PAID && booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException("Ticket is only available for paid bookings");
    }

    const tourTitleRu = (booking.tour.title as { ru?: string }).ru ?? booking.tour.slug;
    const pdf = await this.pdf.generateTicket({
      bookingId: id,
      tourTitle: tourTitleRu,
      contactName: booking.contactName,
      contactEmail: booking.contactEmail,
      contactPhone: booking.contactPhone,
      guestsCount: booking.guestsCount,
      preferredDate: booking.preferredDate?.toISOString() ?? null,
      totalPriceUsd: Number(booking.totalPriceUsd),
      country: booking.tour.country,
      city: booking.tour.city ?? null,
      durationDays: booking.tour.durationDays,
      hotelName: booking.tour.hotelName ?? null,
      paidAt: (booking.paidAt ?? booking.updatedAt).toISOString(),
    });

    const shortId = id.slice(0, 8).toUpperCase();
    return { pdf, filename: `ticket-${shortId}.pdf` };
  }

  async requestPayment(id: string, dto: RequestPaymentDto, adminId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { tour: { select: { title: true, slug: true } } },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException("Payment can only be requested when booking is IN_PROGRESS");
    }

    const paymentDetails = {
      bankName: dto.bankName,
      cardNumber: dto.cardNumber,
      instructions: dto.instructions,
      amount: dto.amount ?? Number(booking.totalPriceUsd),
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.AWAITING_PAYMENT,
          statusChangedAt: new Date(),
          managerId: adminId,
          paymentDetails,
        },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          fromStatus: BookingStatus.IN_PROGRESS,
          toStatus: BookingStatus.AWAITING_PAYMENT,
          changedById: adminId,
        },
      });
      return result;
    });

    const tourTitleRu = (booking.tour.title as { ru?: string }).ru ?? booking.tour.slug;

    if (booking.userId) {
      void this.notifications.create({
        userId: booking.userId,
        type: NotificationType.BOOKING_PAYMENT_REQUESTED,
        title: "Выставлен счёт на оплату",
        body: `По заявке «${tourTitleRu}» выставлен счёт на $${paymentDetails.amount}. Переведите оплату и загрузите квитанцию.`,
        bookingId: id,
      });
    }

    void this.email.sendBookingStatusChanged(
      booking.contactEmail, booking.contactName, tourTitleRu, BookingStatus.AWAITING_PAYMENT,
    ).catch(() => undefined);

    this.logger.log(`Payment requested: booking=${id}, amount=${paymentDetails.amount}`);
    return this.serialize(updated);
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
      select: { id: true, role: true, referralCount: true, isActive: true, commissionRate: true },
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
      const rate = referrer.commissionRate ? Number(referrer.commissionRate) : DEFAULT_COMMISSION_RATE;
      const commission = totalPriceUsd.mul(rate);
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
          description: `Комиссия ${(rate * 100).toFixed(0)}% с заявки $${totalPriceUsd}`,
        },
      });
      void this.notifications.create({
        userId: referrerId,
        type: NotificationType.COMMISSION_EARNED,
        title: "Комиссия начислена",
        body: `На ваш баланс начислено $${Number(commission).toFixed(2)} (${(rate * 100).toFixed(0)}% от заявки $${totalPriceUsd}).`,
      });
      this.logger.log(`Reward (PARTNER): user=${referrerId}, +$${commission} (rate=${rate})`);
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
    paymentDetails?: Prisma.JsonValue | null;
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
      paymentDetails: (b.paymentDetails ?? null) as { bankName: string; cardNumber: string; instructions: string; amount: number } | null,
      referrerId: b.referrerId,
      paidAt: b.paidAt?.toISOString() ?? null,
      completedAt: b.completedAt?.toISOString() ?? null,
      cancelledAt: b.cancelledAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    };
  }
}
