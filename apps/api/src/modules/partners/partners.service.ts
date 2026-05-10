import {
  Injectable, ConflictException, NotFoundException, BadRequestException, Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PartnerApplicationStatus, UserRole } from "@tours/db";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationDecision, ReviewApplicationDto } from "./dto/review-application.dto";

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Клиент подаёт заявку на партнёрство. */
  async submit(userId: string, dto: CreateApplicationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isPartnerApproved: true },
    });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRole.PARTNER || user.isPartnerApproved) {
      throw new ConflictException("Already a partner");
    }
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException("Admins cannot apply for partnership");
    }

    const existing = await this.prisma.partnerApplication.findUnique({
      where: { userId },
      select: { status: true },
    });
    if (existing && existing.status === PartnerApplicationStatus.PENDING) {
      throw new ConflictException("Application already pending");
    }

    // Если был REJECTED — позволяем подать заново через upsert
    const application = await this.prisma.partnerApplication.upsert({
      where: { userId },
      update: {
        motivation: dto.motivation,
        socialLinks: dto.socialLinks ?? [],
        audienceSize: dto.audienceSize,
        status: PartnerApplicationStatus.PENDING,
        rejectReason: null,
        reviewedAt: null,
        reviewedBy: null,
      },
      create: {
        userId,
        motivation: dto.motivation,
        socialLinks: dto.socialLinks ?? [],
        audienceSize: dto.audienceSize,
      },
    });

    return this.serialize(application);
  }

  async getMyApplication(userId: string) {
    const app = await this.prisma.partnerApplication.findUnique({
      where: { userId },
    });
    if (!app) return null;
    return this.serialize(app);
  }

  // ----- Admin -----

  async listAll(status?: PartnerApplicationStatus) {
    const where = status ? { status } : {};
    const apps = await this.prisma.partnerApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, fullName: true, referralCode: true, role: true } },
      },
    });
    return apps.map((a) => ({ ...this.serialize(a), user: a.user }));
  }

  async review(applicationId: string, dto: ReviewApplicationDto, adminId: string) {
    const app = await this.prisma.partnerApplication.findUnique({
      where: { id: applicationId },
    });
    if (!app) throw new NotFoundException("Application not found");
    if (app.status !== PartnerApplicationStatus.PENDING) {
      throw new ConflictException("Application already reviewed");
    }

    if (dto.decision === ApplicationDecision.APPROVE) {
      // Транзакция: обновить заявку + повысить роль пользователя
      const result = await this.prisma.$transaction([
        this.prisma.partnerApplication.update({
          where: { id: applicationId },
          data: {
            status: PartnerApplicationStatus.APPROVED,
            reviewedBy: adminId,
            reviewedAt: new Date(),
          },
        }),
        this.prisma.user.update({
          where: { id: app.userId },
          data: { role: UserRole.PARTNER, isPartnerApproved: true },
        }),
      ]);
      this.logger.log(`Partner approved: user=${app.userId}, app=${applicationId}`);
      return this.serialize(result[0]);
    } else {
      const updated = await this.prisma.partnerApplication.update({
        where: { id: applicationId },
        data: {
          status: PartnerApplicationStatus.REJECTED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectReason: dto.rejectReason,
        },
      });
      this.logger.log(`Partner rejected: user=${app.userId}, app=${applicationId}`);
      return this.serialize(updated);
    }
  }

  private serialize = (a: {
    id: string; userId: string;
    motivation: string; socialLinks: string[]; audienceSize: number | null;
    status: PartnerApplicationStatus;
    rejectReason: string | null;
    createdAt: Date; updatedAt: Date;
  }) => ({
    id: a.id,
    userId: a.userId,
    motivation: a.motivation,
    socialLinks: a.socialLinks,
    audienceSize: a.audienceSize,
    status: a.status,
    rejectReason: a.rejectReason,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  });
}
