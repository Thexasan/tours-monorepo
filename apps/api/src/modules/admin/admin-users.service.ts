import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UserRole } from "@tours/db";

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll({
    search,
    role,
    page,
    pageSize,
  }: {
    search?: string;
    role?: string;
    page: number;
    pageSize: number;
  }) {
    const where = {
      AND: [
        role && Object.values(UserRole).includes(role as UserRole)
          ? { role: role as UserRole }
          : {},
        search
          ? {
              OR: [
                { email: { contains: search, mode: "insensitive" as const } },
                { fullName: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {},
      ],
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          referralCode: true,
          referralCount: true,
          freeToursAvailable: true,
          balance: true,
          isPartnerApproved: true,
          createdAt: true,
          _count: { select: { bookings: true, reviews: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({ ...u, balance: Number(u.balance) })),
      total,
      page,
      pageSize,
    };
  }
}
