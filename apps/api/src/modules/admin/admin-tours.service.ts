import {
  Injectable, NotFoundException, ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@tours/db";
import { CreateTourDto } from "./dto/create-tour.dto";
import { UpdateTourDto } from "./dto/update-tour.dto";

@Injectable()
export class AdminToursService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTourDto) {
    const exists = await this.prisma.tour.findUnique({ where: { slug: dto.slug }, select: { id: true } });
    if (exists) throw new ConflictException("Tour with this slug already exists");

    const tour = await this.prisma.tour.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        programIncluded: dto.programIncluded ?? [],
        programExcluded: dto.programExcluded ?? [],
        country: dto.country,
        city: dto.city ?? null,
        hotelName: dto.hotelName ?? null,
        hotelStars: dto.hotelStars ?? 3,
        mealPlan: dto.mealPlan,
        durationDays: dto.durationDays ?? 7,
        priceUsd: new Prisma.Decimal(dto.priceUsd),
        coverImage: dto.coverImage,
        images: dto.images ?? [],
        roomTypes: (dto.roomTypes ?? []) as unknown as Prisma.InputJsonValue,
        isHot: dto.isHot ?? false,
        referralThreshold: dto.referralThreshold ?? 50,
      },
    });
    return this.serialize(tour);
  }

  async update(id: string, dto: UpdateTourDto) {
    const existing = await this.prisma.tour.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException("Tour not found");

    const data: Prisma.TourUpdateInput = {};
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.programIncluded !== undefined) data.programIncluded = dto.programIncluded;
    if (dto.programExcluded !== undefined) data.programExcluded = dto.programExcluded;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.hotelName !== undefined) data.hotelName = dto.hotelName;
    if (dto.hotelStars !== undefined) data.hotelStars = dto.hotelStars;
    if (dto.mealPlan !== undefined) data.mealPlan = dto.mealPlan;
    if (dto.durationDays !== undefined) data.durationDays = dto.durationDays;
    if (dto.priceUsd !== undefined) data.priceUsd = new Prisma.Decimal(dto.priceUsd);
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
    if (dto.images !== undefined) data.images = dto.images;
    if (dto.roomTypes !== undefined) data.roomTypes = dto.roomTypes as unknown as Prisma.InputJsonValue;
    if (dto.isHot !== undefined) data.isHot = dto.isHot;
    if (dto.referralThreshold !== undefined) data.referralThreshold = dto.referralThreshold;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const tour = await this.prisma.tour.update({ where: { id }, data });
    return this.serialize(tour);
  }

  async archive(id: string) {
    const existing = await this.prisma.tour.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException("Tour not found");
    const tour = await this.prisma.tour.update({ where: { id }, data: { isActive: false } });
    return this.serialize(tour);
  }

  async listAll(includeInactive: boolean) {
    const where = includeInactive ? {} : { isActive: true };
    const tours = await this.prisma.tour.findMany({
      where, orderBy: { createdAt: "desc" },
    });
    return tours.map(this.serialize);
  }

  private serialize = (t: {
    id: string; slug: string; title: unknown; description: unknown;
    programIncluded: unknown; programExcluded: unknown;
    country: string; city: string | null; hotelName: string | null;
    hotelStars: number; mealPlan: string; durationDays: number;
    priceUsd: Prisma.Decimal;
    coverImage: string; images: string[];
    roomTypes: Prisma.JsonValue;
    isActive: boolean; isHot: boolean; referralThreshold: number;
    avgRating: number; reviewsCount: number;
    createdAt: Date; updatedAt: Date;
  }) => ({
    id: t.id, slug: t.slug, title: t.title, description: t.description,
    programIncluded: t.programIncluded, programExcluded: t.programExcluded,
    country: t.country, city: t.city, hotelName: t.hotelName,
    hotelStars: t.hotelStars, mealPlan: t.mealPlan, durationDays: t.durationDays,
    priceUsd: Number(t.priceUsd),
    coverImage: t.coverImage, images: t.images,
    roomTypes: Array.isArray(t.roomTypes) ? t.roomTypes : [],
    isActive: t.isActive, isHot: t.isHot, referralThreshold: t.referralThreshold,
    avgRating: t.avgRating, reviewsCount: t.reviewsCount,
    createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
  });
}
