import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma, BookingStatus, UserRole } from "@tours/db";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { ListBookingsDto } from "./dto/list-bookings.dto";

interface BookingContext {
  userId?: string;            // если залогинен
  referralCode?: string;      // из cookie tours_ref
  ip?: string;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Создание заявки. Гость или клиент — оба могут. */
  async create(dto: CreateBookingDto, ctx: BookingContext) {
    const tour = await this.prisma.tour.findUnique({ where: { id: dto.tourId } });
    if (!tour || !tour.isActive) {
      throw new BadRequestException("Tour not found or inactive");
    }

    // Антифрод: запрет самореферала
    let referrerId: string | null = null;
    if (ctx.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: ctx.referralCode },
        select: { id: true, isActive: true },
      });
      if (referrer && referrer.isActive && referrer.id !== ctx.userId) {
        referrerId = referrer.id;
      }
    }

    const totalPriceUsd = new Prisma.Decimal(tour.priceUsd).mul(dto.guestsCount ?? 1);

    const booking = await this.prisma.booking.create({
      data: {
        tourId: dto.tourId,
        userId: ctx.userId ?? null,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        guestsCount: dto.guestsCount ?? 1,
        preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
        notes: dto.notes,
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
    return this.serialize(booking);
  }

  /** Список заявок текущего пользователя. */
  async listMy(userId: string, query: ListBookingsDto) {
    const where: Prisma.BookingWhereInput = { userId };
    if (query.status) where.status = query.status;

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          tour: { select: { id: true, slug: true, title: true, coverImage: true, country: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items: items.map((b) => ({
        ...this.serialize(b),
        tour: b.tour,
      })),
      total,
      page,
      pageSize,
    };
  }

  /** Список ВСЕХ заявок — только ADMIN. */
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
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
        tour: b.tour,
        user: b.user,
        referrer: b.referrer,
      })),
      total,
      page,
      pageSize,
    };
  }

  /** Получить заявку по id. Клиент видит только свою, ADMIN — любую. */
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

  /** Смена статуса (только ADMIN). На переходе в PAID — Day 5 будет триггер начисления. */
  async updateStatus(id: string, dto: UpdateBookingStatusDto, adminId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException("Booking not found");

    const data: Prisma.BookingUpdateInput = {
      status: dto.status,
      statusChangedAt: new Date(),
      managerId: adminId,
    };
    if (dto.managerNotes !== undefined) data.managerNotes = dto.managerNotes;

    if (dto.status === BookingStatus.PAID && !booking.paidAt) data.paidAt = new Date();
    if (dto.status === BookingStatus.COMPLETED && !booking.completedAt) data.completedAt = new Date();
    if (dto.status === BookingStatus.CANCELLED) {
      data.cancelledAt = new Date();
      if (dto.cancelReason) data.cancelReason = dto.cancelReason;
    }

    const updated = await this.prisma.booking.update({ where: { id }, data });

    // TODO Day 5: если переход IN_PROGRESS → PAID — триггер начисления вознаграждений
    if (booking.status !== BookingStatus.PAID && updated.status === BookingStatus.PAID) {
      this.logger.log(`Booking ${id} → PAID. Reward trigger будет в Day 5.`);
    }

    return this.serialize(updated);
  }

  // ---------- helpers ----------
  private serialize(b: {
    id: string; tourId: string; userId: string | null;
    contactName: string; contactEmail: string; contactPhone: string;
    guestsCount: number; preferredDate: Date | null; notes: string | null;
    totalPriceUsd: Prisma.Decimal;
    status: BookingStatus;
    referrerId: string | null;
    paidAt: Date | null; completedAt: Date | null; cancelledAt: Date | null;
    createdAt: Date; updatedAt: Date;
  }) {
    return {
      id: b.id,
      tourId: b.tourId,
      userId: b.userId,
      contactName: b.contactName,
      contactEmail: b.contactEmail,
      contactPhone: b.contactPhone,
      guestsCount: b.guestsCount,
      preferredDate: b.preferredDate?.toISOString() ?? null,
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
