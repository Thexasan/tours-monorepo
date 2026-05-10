import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma, ReviewStatus } from "@tours/db";
import { ListToursDto } from "./dto/list-tours.dto";

@Injectable()
export class ToursService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListToursDto) {
    const where: Prisma.TourWhereInput = { isActive: true };

    if (query.country) where.country = { equals: query.country, mode: "insensitive" };
    if (query.hotelStars) where.hotelStars = query.hotelStars;
    if (query.mealPlan) where.mealPlan = query.mealPlan;
    if (typeof query.isHot === "boolean") where.isHot = query.isHot;

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.priceUsd = {};
      if (query.minPrice !== undefined) where.priceUsd.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.priceUsd.lte = query.maxPrice;
    }

    if (query.search) {
      where.OR = [
        { country: { contains: query.search, mode: "insensitive" } },
        { city: { contains: query.search, mode: "insensitive" } },
        { hotelName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    let orderBy: Prisma.TourOrderByWithRelationInput = { createdAt: "desc" };
    if (query.sort === "price_asc") orderBy = { priceUsd: "asc" };
    if (query.sort === "price_desc") orderBy = { priceUsd: "desc" };
    if (query.sort === "popular") orderBy = { reviewsCount: "desc" };
    if (query.sort === "newest") orderBy = { createdAt: "desc" };

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.tour.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.tour.count({ where }),
    ]);

    return {
      items: items.map(this.serialize),
      total,
      page,
      pageSize,
    };
  }

  async getBySlug(slug: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { slug },
      include: {
        reviews: {
          where: { status: ReviewStatus.APPROVED },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
            photos: { orderBy: { order: "asc" } },
          },
        },
      },
    });
    if (!tour || !tour.isActive) throw new NotFoundException("Tour not found");

    return {
      ...this.serialize(tour),
      reviews: tour.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        text: r.text,
        status: r.status,
        author: { id: r.user.id, fullName: r.user.fullName, avatarUrl: r.user.avatarUrl },
        tourId: r.tourId,
        tourTitle: tour.title,
        bookingId: r.bookingId,
        photos: r.photos.map((p) => p.url),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  /** Преобразует Prisma-объект тура в API-shape (Decimal → number, дата → ISO). */
  private serialize = (tour: {
    id: string; slug: string; title: unknown; description: unknown;
    programIncluded: unknown; programExcluded: unknown;
    country: string; city: string | null; hotelName: string | null; hotelStars: number;
    mealPlan: string; durationDays: number;
    priceUsd: Prisma.Decimal;
    coverImage: string; images: string[];
    isActive: boolean; isHot: boolean; referralThreshold: number;
    avgRating: number; reviewsCount: number;
    createdAt: Date; updatedAt: Date;
  }) => ({
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    description: tour.description,
    programIncluded: tour.programIncluded,
    programExcluded: tour.programExcluded,
    country: tour.country,
    city: tour.city,
    hotelName: tour.hotelName,
    hotelStars: tour.hotelStars,
    mealPlan: tour.mealPlan,
    durationDays: tour.durationDays,
    priceUsd: Number(tour.priceUsd),
    coverImage: tour.coverImage,
    images: tour.images,
    isActive: tour.isActive,
    isHot: tour.isHot,
    referralThreshold: tour.referralThreshold,
    avgRating: tour.avgRating,
    reviewsCount: tour.reviewsCount,
    createdAt: tour.createdAt.toISOString(),
    updatedAt: tour.updatedAt.toISOString(),
  });
}
