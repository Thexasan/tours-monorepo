import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ReviewStatus } from "@tours/db";
import { ModerationDecision } from "./dto/moderate-review.dto";

const mockTx = {
  review: { update: jest.fn(), aggregate: jest.fn() },
  tour: { update: jest.fn() },
};

const mockPrisma = {
  tour: { findUnique: jest.fn() },
  booking: { findFirst: jest.fn() },
  review: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const makeReview = (overrides: Record<string, unknown> = {}) => ({
  id: "rev-1",
  tourId: "tour-1",
  userId: "user-1",
  bookingId: "booking-1",
  rating: 5,
  text: "Great tour, highly recommend!",
  status: ReviewStatus.PENDING,
  user: { id: "user-1", fullName: "Alice", avatarUrl: null },
  photos: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("ReviewsService", () => {
  let service: ReviewsService;

  beforeEach(async () => {
    jest.resetAllMocks();

    mockPrisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") return (arg as (tx: typeof mockTx) => Promise<unknown>)(mockTx);
      return Promise.all(arg as Promise<unknown>[]);
    });

    mockTx.tour.update.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  describe("create", () => {
    const dto = {
      tourId: "tour-1",
      rating: 5,
      text: "Excellent tour experience!",
    };

    it("creates a PENDING review for a user with an eligible booking", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: "tour-1", isActive: true });
      mockPrisma.booking.findFirst.mockResolvedValue({ id: "booking-1" });
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(makeReview());

      const result = await service.create("user-1", dto);

      expect(result.status).toBe(ReviewStatus.PENDING);
      expect(result.rating).toBe(5);
      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tourId: "tour-1",
            userId: "user-1",
            status: ReviewStatus.PENDING,
          }),
        }),
      );
    });

    it("uses provided bookingId when given", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: "tour-1", isActive: true });
      mockPrisma.booking.findFirst.mockResolvedValue({ id: "eligible-booking" });
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(makeReview({ bookingId: "specific-booking" }));

      await service.create("user-1", { ...dto, bookingId: "specific-booking" });

      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ bookingId: "specific-booking" }),
        }),
      );
    });

    it("trims whitespace from review text", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: "tour-1", isActive: true });
      mockPrisma.booking.findFirst.mockResolvedValue({ id: "booking-1" });
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(makeReview());

      await service.create("user-1", { ...dto, text: "  Great tour!  " });

      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ text: "Great tour!" }),
        }),
      );
    });

    it("throws NotFoundException when the tour does not exist", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(null);

      await expect(service.create("user-1", dto)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.booking.findFirst).not.toHaveBeenCalled();
    });

    it("throws ForbiddenException when user has no paid booking for this tour", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: "tour-1", isActive: true });
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await expect(service.create("user-1", dto)).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });

    it("throws ConflictException when user already reviewed this tour", async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: "tour-1", isActive: true });
      mockPrisma.booking.findFirst.mockResolvedValue({ id: "booking-1" });
      mockPrisma.review.findFirst.mockResolvedValue(makeReview()); // existing review

      await expect(service.create("user-1", dto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });
  });

  describe("moderate", () => {
    it("approves review and recalculates avgRating + reviewsCount for the tour", async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: "rev-1",
        status: ReviewStatus.PENDING,
        tourId: "tour-1",
        rating: 5,
      });
      mockTx.review.update.mockResolvedValue(makeReview({ status: ReviewStatus.APPROVED }));
      mockTx.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { _all: 10 },
      });

      const result = await service.moderate(
        "rev-1",
        { decision: ModerationDecision.APPROVE },
        "admin-1",
      );

      expect(result.status).toBe(ReviewStatus.APPROVED);
      expect(mockTx.tour.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "tour-1" },
          data: { avgRating: 4.5, reviewsCount: 10 },
        }),
      );
    });

    it("sets avgRating to 0 when aggregate returns null (first review deleted)", async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: "rev-1",
        status: ReviewStatus.PENDING,
        tourId: "tour-1",
        rating: 4,
      });
      mockTx.review.update.mockResolvedValue(makeReview({ status: ReviewStatus.APPROVED }));
      mockTx.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { _all: 0 },
      });

      await service.moderate("rev-1", { decision: ModerationDecision.APPROVE }, "admin-1");

      expect(mockTx.tour.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { avgRating: 0, reviewsCount: 0 },
        }),
      );
    });

    it("rejects review and does NOT update tour stats", async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: "rev-1",
        status: ReviewStatus.PENDING,
        tourId: "tour-1",
        rating: 2,
      });
      mockPrisma.review.update.mockResolvedValue(makeReview({ status: ReviewStatus.REJECTED }));

      const result = await service.moderate(
        "rev-1",
        { decision: ModerationDecision.REJECT, rejectReason: "Spam content" },
        "admin-1",
      );

      expect(result.status).toBe(ReviewStatus.REJECTED);
      // tour stats should NOT change on rejection
      expect(mockTx.tour.update).not.toHaveBeenCalled();
      expect(mockTx.review.aggregate).not.toHaveBeenCalled();
    });

    it("saves rejectReason when rejecting", async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: "rev-1",
        status: ReviewStatus.PENDING,
        tourId: "tour-1",
        rating: 1,
      });
      mockPrisma.review.update.mockResolvedValue(makeReview({ status: ReviewStatus.REJECTED }));

      await service.moderate(
        "rev-1",
        { decision: ModerationDecision.REJECT, rejectReason: "Spam content" },
        "admin-1",
      );

      expect(mockPrisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ rejectReason: "Spam content" }),
        }),
      );
    });

    it("throws NotFoundException when review id does not exist", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(
        service.moderate("bad-id", { decision: ModerationDecision.APPROVE }, "admin-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ConflictException when review is already APPROVED", async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: "rev-1",
        status: ReviewStatus.APPROVED,
        tourId: "tour-1",
        rating: 5,
      });

      await expect(
        service.moderate("rev-1", { decision: ModerationDecision.APPROVE }, "admin-1"),
      ).rejects.toThrow(ConflictException);
    });

    it("throws ConflictException when review is already REJECTED", async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: "rev-1",
        status: ReviewStatus.REJECTED,
        tourId: "tour-1",
        rating: 3,
      });

      await expect(
        service.moderate("rev-1", { decision: ModerationDecision.REJECT }, "admin-1"),
      ).rejects.toThrow(ConflictException);
    });

    it("uses $transaction for APPROVE to ensure atomicity", async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: "rev-1",
        status: ReviewStatus.PENDING,
        tourId: "tour-1",
        rating: 5,
      });
      mockTx.review.update.mockResolvedValue(makeReview({ status: ReviewStatus.APPROVED }));
      mockTx.review.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: { _all: 1 } });

      await service.moderate("rev-1", { decision: ModerationDecision.APPROVE }, "admin-1");

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
