import {
  Injectable, BadRequestException, NotFoundException, ConflictException, Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma, PayoutStatus, TransactionType } from "@tours/db";
import { RequestPayoutDto } from "./dto/request-payout.dto";
import { ProcessPayoutDto, PayoutDecision } from "./dto/process-payout.dto";

const MIN_PAYOUT_USD = 50;

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Партнёр запрашивает вывод. Атомарно: списать с balance, создать Payout + Transaction. */
  async request(userId: string, dto: RequestPayoutDto) {
    if (dto.amountUsd < MIN_PAYOUT_USD) {
      throw new BadRequestException(`Минимальная сумма вывода — $${MIN_PAYOUT_USD}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true, role: true, isActive: true },
      });
      if (!user || !user.isActive) throw new NotFoundException("User not found");

      const balance = new Prisma.Decimal(user.balance);
      const amount = new Prisma.Decimal(dto.amountUsd);
      if (balance.lessThan(amount)) {
        throw new BadRequestException(`Недостаточно средств. На балансе: $${balance}`);
      }

      // Списываем с баланса
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });

      // Создаём запрос
      const payout = await tx.payout.create({
        data: {
          userId,
          amountUsd: amount,
          bankDetails: dto.bankDetails as unknown as Prisma.InputJsonValue,
          status: PayoutStatus.REQUESTED,
        },
      });

      // Записываем в audit log
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.PAYOUT_REQUEST,
          amountUsd: amount.neg(), // отрицательная — списание
          increment: 0,
          payoutId: payout.id,
          description: `Запрос вывода $${amount} на ${dto.bankDetails.bank}`,
        },
      });

      this.logger.log(`Payout requested: user=${userId}, amount=$${amount}, payout=${payout.id}`);
      return this.serialize(payout);
    });
  }

  async listMy(userId: string) {
    const payouts = await this.prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return payouts.map(this.serialize);
  }

  async listAll(status?: PayoutStatus) {
    const where = status ? { status } : {};
    const payouts = await this.prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true } },
      },
    });
    return payouts.map((p) => ({ ...this.serialize(p), user: p.user }));
  }

  /** Админ обрабатывает запрос вывода. */
  async process(payoutId: string, dto: ProcessPayoutDto, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({ where: { id: payoutId } });
      if (!payout) throw new NotFoundException("Payout not found");
      if (payout.status !== PayoutStatus.REQUESTED && payout.status !== PayoutStatus.PROCESSING) {
        throw new ConflictException("Payout already processed");
      }

      if (dto.decision === PayoutDecision.APPROVE) {
        const updated = await tx.payout.update({
          where: { id: payoutId },
          data: {
            status: PayoutStatus.PAID,
            processedBy: adminId,
            processedAt: new Date(),
            externalRef: dto.externalRef,
          },
        });
        // Транзакция уже была (PAYOUT_REQUEST со списанием) — баланс не возвращаем.
        // Создадим audit-record что выплата подтверждена.
        await tx.transaction.create({
          data: {
            userId: payout.userId,
            type: TransactionType.PAYOUT_REQUEST, // используем тот же тип, описание помечает завершение
            amountUsd: 0,
            increment: 0,
            payoutId: payout.id,
            performedBy: adminId,
            description: `Выплата подтверждена админом${dto.externalRef ? ` (ref: ${dto.externalRef})` : ""}`,
          },
        });

        this.logger.log(`Payout APPROVED: ${payoutId} by admin=${adminId}`);
        return this.serialize(updated);
      } else {
        // REJECT — возвращаем сумму обратно на баланс
        const updated = await tx.payout.update({
          where: { id: payoutId },
          data: {
            status: PayoutStatus.REJECTED,
            processedBy: adminId,
            processedAt: new Date(),
            rejectReason: dto.rejectReason,
          },
        });

        await tx.user.update({
          where: { id: payout.userId },
          data: { balance: { increment: payout.amountUsd } },
        });

        await tx.transaction.create({
          data: {
            userId: payout.userId,
            type: TransactionType.PAYOUT_REJECTED,
            amountUsd: payout.amountUsd, // положительная — возврат
            increment: 0,
            payoutId: payout.id,
            performedBy: adminId,
            description: `Возврат вывода (${dto.rejectReason ?? "без причины"})`,
          },
        });

        this.logger.log(`Payout REJECTED: ${payoutId} by admin=${adminId}, $${payout.amountUsd} returned`);
        return this.serialize(updated);
      }
    });
  }

  private serialize = (p: {
    id: string; userId: string;
    amountUsd: Prisma.Decimal;
    status: PayoutStatus;
    bankDetails: Prisma.JsonValue;
    processedAt: Date | null;
    rejectReason: string | null;
    externalRef: string | null;
    createdAt: Date; updatedAt: Date;
  }) => ({
    id: p.id,
    userId: p.userId,
    amountUsd: Number(p.amountUsd),
    status: p.status,
    bankDetails: p.bankDetails,
    processedAt: p.processedAt?.toISOString() ?? null,
    rejectReason: p.rejectReason,
    externalRef: p.externalRef,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  });
}
