import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { PayoutsService } from "./payouts.service";
import { PrismaService } from "../../prisma/prisma.service";
import { PayoutStatus, Prisma } from "@tours/db";
import { PayoutDecision } from "./dto/process-payout.dto";

const mockTx = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  payout: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  transaction: { create: jest.fn() },
};

const mockPrisma = {
  payout: { findMany: jest.fn() },
  $transaction: jest.fn(),
};

const bankDetails = {
  bank: "Test Bank",
  accountNumber: "1234567890",
  swift: "TESTUS33",
  beneficiary: "Alice Test",
};

const makePayout = (overrides: Record<string, unknown> = {}) => ({
  id: "payout-1",
  userId: "user-1",
  amountUsd: new Prisma.Decimal("100.00"),
  status: PayoutStatus.REQUESTED,
  bankDetails,
  processedAt: null,
  rejectReason: null,
  externalRef: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("PayoutsService", () => {
  let service: PayoutsService;

  beforeEach(async () => {
    jest.resetAllMocks();

    mockPrisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") return (arg as (tx: typeof mockTx) => Promise<unknown>)(mockTx);
      return Promise.all(arg as Promise<unknown>[]);
    });

    mockTx.transaction.create.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PayoutsService>(PayoutsService);
  });

  describe("request", () => {
    const dto = { amountUsd: 100, bankDetails };

    it("creates payout and debits balance when funds are sufficient", async () => {
      mockTx.user.findUnique.mockResolvedValue({
        id: "user-1",
        balance: new Prisma.Decimal("200.00"),
        role: "PARTNER",
        isActive: true,
      });
      mockTx.user.update.mockResolvedValue({});
      mockTx.payout.create.mockResolvedValue(makePayout());

      const result = await service.request("user-1", dto);

      expect(result.amountUsd).toBe(100);
      expect(result.status).toBe(PayoutStatus.REQUESTED);
      expect(mockTx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: { balance: { decrement: expect.any(Object) } },
        }),
      );
    });

    it("throws BadRequestException when amount is below the $50 minimum", async () => {
      await expect(
        service.request("user-1", { amountUsd: 49, bankDetails }),
      ).rejects.toThrow(BadRequestException);

      // should not even enter the transaction
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws BadRequestException when balance is insufficient", async () => {
      mockTx.user.findUnique.mockResolvedValue({
        id: "user-1",
        balance: new Prisma.Decimal("30.00"),
        role: "PARTNER",
        isActive: true,
      });

      await expect(service.request("user-1", dto)).rejects.toThrow(BadRequestException);
      expect(mockTx.user.update).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when user does not exist", async () => {
      mockTx.user.findUnique.mockResolvedValue(null);

      await expect(service.request("bad-user", dto)).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException when user is deactivated", async () => {
      mockTx.user.findUnique.mockResolvedValue({
        id: "user-1",
        balance: new Prisma.Decimal("200.00"),
        role: "PARTNER",
        isActive: false,
      });

      await expect(service.request("user-1", dto)).rejects.toThrow(NotFoundException);
    });

    it("creates an audit transaction record", async () => {
      mockTx.user.findUnique.mockResolvedValue({
        id: "user-1",
        balance: new Prisma.Decimal("200.00"),
        role: "PARTNER",
        isActive: true,
      });
      mockTx.user.update.mockResolvedValue({});
      mockTx.payout.create.mockResolvedValue(makePayout());

      await service.request("user-1", dto);

      expect(mockTx.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "PAYOUT_REQUEST",
            userId: "user-1",
          }),
        }),
      );
    });
  });

  describe("process", () => {
    it("approves payout and marks status as PAID", async () => {
      mockTx.payout.findUnique.mockResolvedValue(makePayout());
      mockTx.payout.update.mockResolvedValue(makePayout({ status: PayoutStatus.PAID }));

      const result = await service.process(
        "payout-1",
        { decision: PayoutDecision.APPROVE, externalRef: "bank-tx-123" },
        "admin-1",
      );

      expect(result.status).toBe(PayoutStatus.PAID);
      expect(mockTx.payout.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PayoutStatus.PAID,
            externalRef: "bank-tx-123",
            processedBy: "admin-1",
          }),
        }),
      );
      // Balance should NOT be modified on approval (it was already debited on request)
      expect(mockTx.user.update).not.toHaveBeenCalled();
    });

    it("rejects payout, marks status as REJECTED, and returns balance to user", async () => {
      mockTx.payout.findUnique.mockResolvedValue(makePayout());
      mockTx.payout.update.mockResolvedValue(
        makePayout({ status: PayoutStatus.REJECTED, rejectReason: "Incorrect details" }),
      );
      mockTx.user.update.mockResolvedValue({});

      const result = await service.process(
        "payout-1",
        { decision: PayoutDecision.REJECT, rejectReason: "Incorrect details" },
        "admin-1",
      );

      expect(result.status).toBe(PayoutStatus.REJECTED);
      // Balance must be returned
      expect(mockTx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { balance: { increment: expect.any(Object) } },
        }),
      );
      // PAYOUT_REJECTED audit record
      expect(mockTx.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: "PAYOUT_REJECTED" }),
        }),
      );
    });

    it("throws NotFoundException when payout id does not exist", async () => {
      mockTx.payout.findUnique.mockResolvedValue(null);

      await expect(
        service.process("bad-id", { decision: PayoutDecision.APPROVE }, "admin-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ConflictException when payout is already in PAID status", async () => {
      mockTx.payout.findUnique.mockResolvedValue(makePayout({ status: PayoutStatus.PAID }));

      await expect(
        service.process("payout-1", { decision: PayoutDecision.APPROVE }, "admin-1"),
      ).rejects.toThrow(ConflictException);
    });

    it("throws ConflictException when payout is already REJECTED", async () => {
      mockTx.payout.findUnique.mockResolvedValue(makePayout({ status: PayoutStatus.REJECTED }));

      await expect(
        service.process("payout-1", { decision: PayoutDecision.REJECT }, "admin-1"),
      ).rejects.toThrow(ConflictException);
    });

    it("allows processing a PROCESSING-status payout", async () => {
      mockTx.payout.findUnique.mockResolvedValue(makePayout({ status: PayoutStatus.PROCESSING }));
      mockTx.payout.update.mockResolvedValue(makePayout({ status: PayoutStatus.PAID }));

      const result = await service.process(
        "payout-1",
        { decision: PayoutDecision.APPROVE },
        "admin-1",
      );

      expect(result.status).toBe(PayoutStatus.PAID);
    });
  });
});
