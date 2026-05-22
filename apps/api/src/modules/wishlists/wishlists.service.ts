import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType, Prisma } from "@tours/db";

@Injectable()
export class WishlistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async toggle(userId: string, tourId: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      select: { id: true, priceUsd: true },
    });
    if (!tour) throw new NotFoundException("Tour not found");

    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_tourId: { userId, tourId } },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { wishlisted: false };
    }

    await this.prisma.wishlist.create({
      data: { userId, tourId, priceAtSave: tour.priceUsd },
    });
    return { wishlisted: true };
  }

  async listMy(userId: string) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        tour: {
          select: {
            id: true, slug: true, title: true, country: true, city: true,
            coverImage: true, priceUsd: true, durationDays: true,
            hotelStars: true, avgRating: true, reviewsCount: true, isHot: true,
          },
        },
      },
    });

    return {
      items: items.map((w) => ({
        id: w.id,
        tourId: w.tourId,
        priceAtSave: Number(w.priceAtSave),
        createdAt: w.createdAt.toISOString(),
        priceDrop: Number(w.tour.priceUsd) < Number(w.priceAtSave),
        tour: {
          ...w.tour,
          priceUsd: Number(w.tour.priceUsd),
        },
      })),
      total: items.length,
    };
  }

  async getStatus(userId: string, tourId: string) {
    const item = await this.prisma.wishlist.findUnique({
      where: { userId_tourId: { userId, tourId } },
      select: { id: true },
    });
    return { wishlisted: !!item };
  }

  /** Called by AdminToursService when priceUsd changes — notifies all wishlisters */
  async notifyPriceDrop(tourId: string, oldPrice: Prisma.Decimal, newPrice: Prisma.Decimal) {
    if (newPrice.gte(oldPrice)) return;

    const wishlisters = await this.prisma.wishlist.findMany({
      where: { tourId, priceAtSave: { gt: newPrice } },
      select: { userId: true, tour: { select: { title: true } } },
    });

    await Promise.all(
      wishlisters.map((w) => {
        const title = (w.tour.title as Record<string, string>).ru ?? "тур";
        return this.notifications.create({
          userId: w.userId,
          type: NotificationType.WISHLIST_PRICE_DROP,
          title: "Цена снизилась!",
          body: `Тур «${title}» теперь стоит $${Number(newPrice).toLocaleString()} — дешевле, чем когда вы добавили его в избранное.`,
        });
      }),
    );
  }
}
