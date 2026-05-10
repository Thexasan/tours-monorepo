import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const exists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("User not found");

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true, email: true, fullName: true, avatarUrl: true, role: true,
        referralCode: true, referralCount: true, freeToursAvailable: true,
        balance: true, isPartnerApproved: true,
      },
    });
    return { ...updated, balance: Number(updated.balance) };
  }
}
