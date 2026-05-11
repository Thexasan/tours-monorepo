import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { BookingStatus, UserRole, Prisma } from "@tours/db";

// Separate mock tx object used inside $transaction callbacks
const mockTx = {
  booking: { update: jest.fn() },
  user: { findUnique: jest.fn(), update: jest.fn() },
  tour: { findUnique: jest.fn() },
  transaction: { create: jest.fn() },
};

const mockPrisma = {
  tour: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  booking: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockEmail = {
  sendBookingReceived: jest.fn().mockResolvedValue(undefined),
  sendBookingStatusChanged: jest.fn().mockResolvedValue(undefined),
  sendReferralRewarded: jest.fn().mockResolvedValue(undefined),
};

const makeTour = (overrides: Record<string, unknown> = {}) => ({
  id: "tour-1",
  slug: "turkey-2024",
  title: { ru: "Тур в Турцию" },
  country: "Turkey",
  coverImage: "https://img.example.com/cover.jpg",
  priceUsd: new Prisma.Decimal("1000.00"),
  isActive: true,
  referralThreshold: 3,
  ...overrides,
});

const makeBooking = (overrides: Record<string, unknown> = {}) => ({
  id: "booking-1",
  tourId: "tour-1",
  userId: "user-1",
  contactName: "Alice",
  contactEmail: "alice@example.com",
  contactPhone: "+998901234567",
  guestsCount: 1,
  preferredDate: null,
  notes: null,
  totalPriceUsd: new Prisma.Decimal("1000.00"),
  status: BookingStatus.NEW,
  referrerId: null,
  referralCookieAt: null,
  referralIp: null,
  paidAt: null,
  completedAt: null,
  cancelledAt: null,
  cancelReason: null,
  managerNotes: null,
  managerId: null,
  statusChangedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  tour: {
    id: "tour-1",
    slug: "turkey-2024",
    title: { ru: "Тур в Турцию" },
    referralThreshold: 3,
  },
  ...overrides,
});

describe("BookingsService", () => {
  let service: BookingsService;

  beforeEach(async () => {
    jest.resetAllMocks();

    mockPrisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") return (arg as (tx: typeof mockTx) => Promise<unknown>)(mockTx);
      return Promise.all(arg as Promise<unknown>[]);
    });

    mockEmail.sendBookingReceived.mockResolvedValue(undefined);
    mockEmail.sendBookingStatusChanged.mockResolvedValue(undefined);
    mockEmail.sendReferralRewarded.mockResolvedValue(undefined);
    mockTx.transaction.create.mockResolvedValue({});
    mockTx.user.update.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe("create", () => {
    const dto = {
      tourId: "tour-1",
      contactName: "Alice",
      contactEmail: "alice@example.com",
      contactPhone: "+998901234567",
    };

    it("creates a booking without referral", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(makeTour());
      mockPrisma.booking.create.mockResolvedValue(makeBooking());

      const result = await service.create(dto, { userId: "user-1" });

      expect(result.id).toBe("booking-1");
      expect(result.totalPriceUsd).toBe(1000);
      expect(mockPrisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ referrerId: null }),
        }),
      );
    });

    it("throws BadRequestException when tour does not exist", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, {})).rejects.toThrow(BadRequestException);
      expect(mockPrisma.booking.create).not.toHaveBeenCalled();
    });

    it("throws BadRequestException when tour is inactive", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(makeTour({ isActive: false }));

      await expect(service.create(dto, {})).rejects.toThrow(BadRequestException);
    });

    it("sets referrerId when a valid referral code is provided", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(makeTour());
      mockPrisma.user.findUnique.mockResolvedValue({ id: "ref-1", isActive: true });
      mockPrisma.booking.findFirst.mockResolvedValue(null); // no earlier booking for anti-fraud
      mockPrisma.booking.create.mockResolvedValue(makeBooking({ referrerId: "ref-1" }));

      const result = await service.create(dto, { userId: "user-2", referralCode: "REFCODE1" });

      expect(result.referrerId).toBe("ref-1");
    });

    it("blocks self-referral (userId === referrer.id)", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(makeTour());
      // referrer.id === ctx.userId → self-referral → skip
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", isActive: true });
      mockPrisma.booking.create.mockResolvedValue(makeBooking());

      await service.create(dto, { userId: "user-1", referralCode: "SELFCODE" });

      const createCall = mockPrisma.booking.create.mock.calls[0]?.[0] as { data: Record<string, unknown> };
      expect(createCall?.data?.referrerId).toBeNull();
    });

    it("anti-fraud: blocks referrer if email was already linked to a different referrer", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(makeTour());
      mockPrisma.user.findUnique.mockResolvedValue({ id: "new-ref", isActive: true });
      // earlier booking linked to a DIFFERENT referrer
      mockPrisma.booking.findFirst.mockResolvedValue({ referrerId: "old-ref" });
      mockPrisma.booking.create.mockResolvedValue(makeBooking());

      await service.create(dto, { userId: "user-2", referralCode: "NEWCODE" });

      const createCall = mockPrisma.booking.create.mock.calls[0]?.[0] as { data: Record<string, unknown> };
      expect(createCall?.data?.referrerId).toBeNull();
    });

    it("calculates totalPriceUsd as price × guestsCount", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(makeTour({ priceUsd: new Prisma.Decimal("500.00") }));
      mockPrisma.booking.create.mockResolvedValue(
        makeBooking({ guestsCount: 2, totalPriceUsd: new Prisma.Decimal("1000.00") }),
      );

      await service.create({ ...dto, guestsCount: 2 }, {});

      const createCall = mockPrisma.booking.create.mock.calls[0]?.[0] as {
        data: { totalPriceUsd: Prisma.Decimal };
      };
      expect(Number(createCall?.data?.totalPriceUsd)).toBe(1000);
    });
  });

  describe("getById", () => {
    it("returns booking for its owner", async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...makeBooking(),
        user: { id: "user-1", email: "alice@example.com", fullName: "Alice" },
      });

      const result = await service.getById("booking-1", { id: "user-1", role: UserRole.CLIENT });
      expect(result.id).toBe("booking-1");
    });

    it("returns booking for ADMIN regardless of owner", async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...makeBooking({ userId: "other-user" }),
        user: null,
      });

      const result = await service.getById("booking-1", { id: "admin-1", role: UserRole.ADMIN });
      expect(result.id).toBe("booking-1");
    });

    it("throws ForbiddenException when non-admin accesses someone else's booking", async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...makeBooking({ userId: "other-user" }),
        user: null,
      });

      await expect(
        service.getById("booking-1", { id: "user-1", role: UserRole.CLIENT }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("throws NotFoundException for unknown booking id", async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.getById("bad-id", { id: "user-1", role: UserRole.CLIENT }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateStatus", () => {
    it("throws NotFoundException for unknown booking", async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus("bad-id", { status: BookingStatus.PAID }, "admin-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("applies CLIENT referral reward (+1 referralCount) when status changes to PAID", async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(makeBooking({ referrerId: "ref-1" }));
      mockTx.booking.update.mockResolvedValue(makeBooking({ status: BookingStatus.PAID, referrerId: "ref-1" }));

      // applyReferralReward: fetch referrer (role=CLIENT)
      mockTx.user.findUnique
        .mockResolvedValueOnce({ id: "ref-1", role: UserRole.CLIENT, referralCount: 2, isActive: true })
        // fetch referrer email for reward notification
        .mockResolvedValueOnce({ email: "ref@example.com", fullName: "Referrer" });

      mockTx.tour.findUnique.mockResolvedValue({ referralThreshold: 3 });

      await service.updateStatus("booking-1", { status: BookingStatus.PAID }, "admin-1");

      expect(mockTx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ref-1" },
          data: expect.objectContaining({ referralCount: { increment: 1 } }),
        }),
      );
      expect(mockTx.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: "REFERRAL_COUNT", userId: "ref-1" }),
        }),
      );
    });

    it("grants free tour when CLIENT crosses the referralThreshold", async () => {
      // referralCount=2, threshold=3 → newCount=3 >= threshold → earnedFreeTour
      mockPrisma.booking.findUnique.mockResolvedValue(makeBooking({ referrerId: "ref-1" }));
      mockTx.booking.update.mockResolvedValue(makeBooking({ status: BookingStatus.PAID, referrerId: "ref-1" }));
      mockTx.user.findUnique
        .mockResolvedValueOnce({ id: "ref-1", role: UserRole.CLIENT, referralCount: 2, isActive: true })
        .mockResolvedValueOnce({ email: "ref@example.com", fullName: "Referrer" });
      mockTx.tour.findUnique.mockResolvedValue({ referralThreshold: 3 });

      await service.updateStatus("booking-1", { status: BookingStatus.PAID }, "admin-1");

      expect(mockTx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ freeToursAvailable: { increment: 1 } }),
        }),
      );
    });

    it("applies PARTNER commission (5%) when status changes to PAID", async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(makeBooking({ referrerId: "partner-1" }));
      mockTx.booking.update.mockResolvedValue(
        makeBooking({ status: BookingStatus.PAID, referrerId: "partner-1" }),
      );
      mockTx.user.findUnique
        .mockResolvedValueOnce({ id: "partner-1", role: UserRole.PARTNER, referralCount: 0, isActive: true })
        .mockResolvedValueOnce({ email: "partner@example.com", fullName: "Partner" });

      await service.updateStatus("booking-1", { status: BookingStatus.PAID }, "admin-1");

      // commission = 1000 * 0.05 = 50
      expect(mockTx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "partner-1" },
          data: expect.objectContaining({ balance: { increment: expect.any(Object) } }),
        }),
      );
      expect(mockTx.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: "COMMISSION_EARNED", userId: "partner-1" }),
        }),
      );
    });

    it("does not apply reward when booking has no referrer", async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(makeBooking({ referrerId: null }));
      mockTx.booking.update.mockResolvedValue(makeBooking({ status: BookingStatus.PAID }));

      await service.updateStatus("booking-1", { status: BookingStatus.PAID }, "admin-1");

      expect(mockTx.user.findUnique).not.toHaveBeenCalled();
      expect(mockTx.user.update).not.toHaveBeenCalled();
    });

    it("does not re-apply reward if booking was already in PAID status", async () => {
      // status is already PAID → isNewlyPaid = false
      mockPrisma.booking.findUnique.mockResolvedValue(
        makeBooking({ status: BookingStatus.PAID, referrerId: "ref-1" }),
      );
      mockTx.booking.update.mockResolvedValue(makeBooking({ status: BookingStatus.PAID }));

      await service.updateStatus("booking-1", { status: BookingStatus.PAID }, "admin-1");

      expect(mockTx.user.findUnique).not.toHaveBeenCalled();
    });

    it("skips inactive referrer during reward calculation", async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(makeBooking({ referrerId: "ref-1" }));
      mockTx.booking.update.mockResolvedValue(makeBooking({ status: BookingStatus.PAID, referrerId: "ref-1" }));
      mockTx.user.findUnique
        .mockResolvedValueOnce({ id: "ref-1", role: UserRole.CLIENT, referralCount: 0, isActive: false })
        .mockResolvedValueOnce({ email: "ref@example.com", fullName: "Referrer" });

      await service.updateStatus("booking-1", { status: BookingStatus.PAID }, "admin-1");

      expect(mockTx.user.update).not.toHaveBeenCalled();
    });
  });
});
