import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
  ForbiddenException, Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma, ReviewStatus, BookingStatus, UserRole } from "@tours/db";
import { CreateReviewDto } from "./dto/create-review.dto";
import { ListReviewsDto } from "./dto/list-reviews.dto";
import { ModerateReviewDto, ModerationDecision } from "./dto/moderate-review.dto";

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Клиент создаёт отзыв. Можно только если у него есть оплаченная заявка на этот тур. */
  async create(userId: string, dto: CreateReviewDto) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: dto.tourId }, select: { id: true, isActive: true },
    });
    if (!tour) throw new NotFoundException("Tour not found");

    // Проверка: должна быть оплаченная или завершённая заявка от этого пользователя
    const eligibleBooking = await this.prisma.booking.findFirst({
      where: {
        tourId: dto.tourId,
        userId,
        status: { in: [BookingStatus.PAID, BookingStatus.COMPLETED] },
      },
      select: { id: true },
    });
    if (!eligibleBooking) {
      throw new ForbiddenException("You can leave a review only after a paid booking for this tour");
    }

    // Один отзыв от одного пользователя на один тур (можно перезаписать)
    const existing = await this.prisma.review.findFirst({
      where: { tourId: dto.tourId, userId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("You have already reviewed this tour");
    }

    const photoUrls = dto.photoUrls ?? [];
    const review = await this.prisma.review.create({
      data: {
        tourId: dto.tourId,
        userId,
        bookingId: dto.bookingId ?? eligibleBooking.id,
        rating: dto.rating,
        text: dto.text.trim(),
        status: ReviewStatus.PENDING,
        photos: { create: photoUrls.map((url, i) => ({ url, order: i })) },
      },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } }, photos: true },
    });

    this.logger.log(`Review created (PENDING): ${review.id} by user=${userId}, tour=${dto.tourId}`);
    return this.serialize(review);
  }

  /** Мои отзывы. */
  async listMy(userId: string, query: ListReviewsDto) {
    const where: Prisma.ReviewWhereInput = { userId };
    if (query.status) where.status = query.status;

    const items = await this.prisma.review.findMany({
      where, orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        photos: { orderBy: { order: "asc" } },
        tour: { select: { id: true, slug: true, title: true } },
      },
    });
    return items.map((r) => ({ ...this.serialize(r), tour: r.tour }));
  }

  /** Публичный список — только APPROVED. */
  async listPublic(query: ListReviewsDto) {
    const where: Prisma.ReviewWhereInput = { status: ReviewStatus.APPROVED };
    if (query.tourId) where.tourId = query.tourId;

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;

    const items = await this.prisma.review.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize, take: pageSize,
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        photos: { orderBy: { order: "asc" } },
        tour: { select: { id: true, slug: true, title: true } },
      },
    });
    return items.map((r) => ({
      ...this.serialize(r),
      tourTitle: r.tour.title,
    }));
  }

  /** Список для админа — фильтрация по статусу. */
  async listAdmin(query: ListReviewsDto) {
    const where: Prisma.ReviewWhereInput = {};
    if (query.status) where.status = query.status;

    const items = await this.prisma.review.findMany({
      where, orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, email: true } },
        photos: { orderBy: { order: "asc" } },
        tour: { select: { id: true, slug: true, title: true, country: true } },
      },
    });
    return items.map((r) => ({ ...this.serialize(r), tour: r.tour, userEmail: r.user.email }));
  }

  /** Модерация отзыва. При APPROVE — обновляем avgRating и reviewsCount тура атомарно. */
  async moderate(reviewId: string, dto: ModerateReviewDto, adminId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId }, select: { id: true, status: true, tourId: true, rating: true },
    });
    if (!review) throw new NotFoundException("Review not found");
    if (review.status !== ReviewStatus.PENDING) {
      throw new ConflictException("Review already moderated");
    }

    if (dto.decision === ModerationDecision.APPROVE) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.review.update({
          where: { id: reviewId },
          data: {
            status: ReviewStatus.APPROVED,
            moderatedBy: adminId,
            moderatedAt: new Date(),
          },
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
            photos: { orderBy: { order: "asc" } },
          },
        });

        // Пересчитать avgRating и reviewsCount тура
        const stats = await tx.review.aggregate({
          where: { tourId: review.tourId, status: ReviewStatus.APPROVED },
          _avg: { rating: true },
          _count: { _all: true },
        });
        await tx.tour.update({
          where: { id: review.tourId },
          data: {
            avgRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(2)) : 0,
            reviewsCount: stats._count._all,
          },
        });

        this.logger.log(`Review APPROVED: ${reviewId}, tour stats updated`);
        return this.serialize(updated);
      });
    } else {
      const updated = await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          status: ReviewStatus.REJECTED,
          moderatedBy: adminId,
          moderatedAt: new Date(),
          rejectReason: dto.rejectReason,
        },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          photos: { orderBy: { order: "asc" } },
        },
      });
      this.logger.log(`Review REJECTED: ${reviewId}`);
      return this.serialize(updated);
    }
  }

  private serialize(r: {
    id: string; tourId: string;
    user: { id: string; fullName: string; avatarUrl: string | null };
    bookingId: string | null;
    rating: number; text: string; status: ReviewStatus;
    photos: { url: string }[];
    createdAt: Date; updatedAt: Date;
  }) {
    return {
      id: r.id,
      rating: r.rating,
      text: r.text,
      status: r.status,
      author: {
        id: r.user.id,
        fullName: r.user.fullName,
        avatarUrl: r.user.avatarUrl,
      },
      tourId: r.tourId,
      bookingId: r.bookingId,
      photos: r.photos.map((p) => p.url),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}
