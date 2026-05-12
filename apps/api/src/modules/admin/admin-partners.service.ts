import {
  Injectable, ConflictException, NotFoundException, BadRequestException, Logger,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { UserRole, Prisma } from "@tours/db";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { UpdatePartnerDto } from "./dto/update-partner.dto";

const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const REFERRAL_CODE_LENGTH = 8;
const TEMP_PASSWORD_LENGTH = 10;
const TEMP_PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // без 0/O/1/I — читаемо

@Injectable()
export class AdminPartnersService {
  private readonly logger = new Logger(AdminPartnersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  /** Создать партнёра вручную (из админки). Генерит временный пароль + реф-код. */
  async create(dto: CreatePartnerDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("Email already registered");

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const referralCode = await this.generateUniqueReferralCode();

    const partner = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim(),
        role: UserRole.PARTNER,
        isPartnerApproved: true,
        referralCode,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true, email: true, fullName: true, phone: true,
        role: true, referralCode: true, balance: true,
        isActive: true, isPartnerApproved: true, createdAt: true,
      },
    });

    // Отправляем email с временным паролем (fire-and-forget)
    void this.email
      .sendPartnerWelcome(partner.email, partner.fullName, tempPassword)
      .catch(() => undefined);

    this.logger.log(`Partner created by admin: ${partner.email} (id=${partner.id})`);

    return { ...partner, balance: Number(partner.balance) };
  }

  /** Список всех партнёров с метриками. */
  async listAll({ search, page, pageSize }: { search?: string; page: number; pageSize: number }) {
    const where: Prisma.UserWhereInput = {
      role: UserRole.PARTNER,
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { fullName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, email: true, fullName: true, phone: true,
          referralCode: true, balance: true,
          isActive: true, isPartnerApproved: true, createdAt: true,
          _count: { select: { referrals: true } }, // сколько привёл пользователей
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        ...u,
        balance: Number(u.balance),
        referralsCount: u._count.referrals,
      })),
      total,
      page,
      pageSize,
    };
  }

  /** Обновить партнёра (имя, телефон, активен/нет). */
  async update(id: string, dto: UpdatePartnerDto) {
    const partner = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!partner || partner.role !== UserRole.PARTNER) {
      throw new NotFoundException("Partner not found");
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim();
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, fullName: true, phone: true,
        role: true, referralCode: true, balance: true,
        isActive: true, isPartnerApproved: true, createdAt: true,
      },
    });

    this.logger.log(`Partner updated: ${updated.email} (id=${id})`);
    return { ...updated, balance: Number(updated.balance) };
  }

  /** Сгенерировать новый временный пароль и отправить партнёру на email. */
  async resetPassword(id: string) {
    const partner = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, role: true },
    });
    if (!partner || partner.role !== UserRole.PARTNER) {
      throw new NotFoundException("Partner not found");
    }

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { passwordHash } }),
      // Отзываем все активные refresh-токены, чтобы старые сессии умерли
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    void this.email
      .sendPartnerPasswordReset(partner.email, partner.fullName, tempPassword)
      .catch(() => undefined);

    this.logger.log(`Partner password reset: ${partner.email} (id=${id})`);
    return { ok: true };
  }

  private generateTempPassword(): string {
    const bytes = randomBytes(TEMP_PASSWORD_LENGTH);
    let pw = "";
    for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
      pw += TEMP_PASSWORD_ALPHABET[bytes[i]! % TEMP_PASSWORD_ALPHABET.length];
    }
    return pw;
  }

  private async generateUniqueReferralCode(maxAttempts = 10): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const code = this.randomReferralCode();
      const exists = await this.prisma.user.findUnique({
        where: { referralCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    throw new BadRequestException("Failed to generate unique referral code");
  }

  private randomReferralCode(): string {
    const bytes = randomBytes(REFERRAL_CODE_LENGTH);
    let code = "";
    for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
      code += REFERRAL_CODE_ALPHABET[bytes[i]! % REFERRAL_CODE_ALPHABET.length];
    }
    return code;
  }
}
