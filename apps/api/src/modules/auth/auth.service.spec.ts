import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { UserRole } from "@tours/db";

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("$hashed"),
  compare: jest.fn(),
}));
import * as bcrypt from "bcryptjs";

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: "u1",
  email: "alice@example.com",
  fullName: "Alice",
  passwordHash: "$hashed",
  role: UserRole.CLIENT,
  referralCode: "ALICE123",
  isActive: true,
  balance: 0,
  referralCount: 0,
  freeToursAvailable: 0,
  isPartnerApproved: false,
  ...overrides,
});

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
  },
  otpCode: {
    count: jest.fn().mockResolvedValue(0),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    create: jest.fn().mockResolvedValue({}),
    findFirst: jest.fn().mockResolvedValue({ id: "otp1", code: "123456" }),
    update: jest.fn().mockResolvedValue({}),
  },
  booking: {
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
};

const mockJwt = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue("test_secret"),
  get: jest.fn().mockReturnValue("15m"),
};

const mockEmail = {
  sendWelcome: jest.fn().mockResolvedValue(undefined),
};

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.resetAllMocks();
    mockConfig.getOrThrow.mockReturnValue("test_secret");
    mockConfig.get.mockReturnValue("15m");
    mockEmail.sendWelcome.mockResolvedValue(undefined);
    mockPrisma.refreshToken.create.mockResolvedValue({});
    mockJwt.signAsync.mockResolvedValue("mock_token");
    mockPrisma.otpCode.count.mockResolvedValue(0);
    mockPrisma.otpCode.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.otpCode.create.mockResolvedValue({});
    mockPrisma.otpCode.findFirst.mockResolvedValue({ id: "otp1", code: "123456" });
    mockPrisma.otpCode.update.mockResolvedValue({});
    mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe("register", () => {
    it("creates user and returns tokens for a new email", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // email uniqueness check
        .mockResolvedValue(null);    // referral code uniqueness check
      mockPrisma.user.create.mockResolvedValue(makeUser());

      const result = await service.register({
        email: "Alice@Example.com",
        password: "password123",
        fullName: "Alice",
        otp: "123456",
      });

      expect(result.tokens.accessToken).toBe("mock_token");
      expect(result.tokens.refreshToken).toBe("mock_token");
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      // email is normalized to lowercase
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: "alice@example.com" }),
        }),
      );
    });

    it("throws ConflictException when email already registered", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(makeUser());

      await expect(
        service.register({ email: "alice@example.com", password: "pass", fullName: "Alice", otp: "123456" }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("sets referrerId when valid referral code is provided", async () => {
      const referrer = makeUser({ id: "ref-1", referralCode: "REFCODE1" });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)     // email check
        .mockResolvedValueOnce(referrer) // referral code lookup
        .mockResolvedValue(null);        // unique code generation
      mockPrisma.user.create.mockResolvedValue(makeUser());

      await service.register({
        email: "new@example.com",
        password: "password123",
        fullName: "New User",
        referralCode: "refcode1",
        otp: "123456",
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ referrerId: "ref-1" }),
        }),
      );
    });

    it("ignores referral code of inactive referrer", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeUser({ isActive: false }))
        .mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(makeUser());

      await service.register({
        email: "new@example.com",
        password: "password123",
        fullName: "New",
        referralCode: "INACTIVE",
        otp: "123456",
      });

      const createCall = mockPrisma.user.create.mock.calls[0]?.[0] as { data: Record<string, unknown> };
      expect(createCall?.data?.referrerId).toBeUndefined();
    });

    it("sends welcome email after registration", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(makeUser());

      await service.register({ email: "alice@example.com", password: "pass123", fullName: "Alice", otp: "123456" });

      // fire-and-forget: await the promise so the mock is called before assertion
      await Promise.resolve();
      expect(mockEmail.sendWelcome).toHaveBeenCalledTimes(1);
    });
  });

  describe("login", () => {
    it("returns tokens for valid credentials", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: "alice@example.com", password: "password123" });

      expect(result.userId).toBe("u1");
      expect(result.tokens.accessToken).toBe("mock_token");
    });

    it("normalizes email to lowercase before lookup", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({ email: "Alice@Example.COM", password: "pass" });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: "alice@example.com" } }),
      );
    });

    it("throws UnauthorizedException for unknown email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: "unknown@example.com", password: "pass" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException for wrong password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: "alice@example.com", password: "wrong_password" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException for deactivated account", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser({ isActive: false }));

      await expect(
        service.login({ email: "alice@example.com", password: "pass" }),
      ).rejects.toThrow(UnauthorizedException);

      // bcrypt should NOT be called — account check happens before password check
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("revokes the refresh token by setting revokedAt", async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout("some_refresh_token_value");

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ revokedAt: null }),
          data: { revokedAt: expect.any(Date) },
        }),
      );
    });

    it("is a no-op when no refresh token provided", async () => {
      await service.logout(undefined);

      expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("getProfile", () => {
    it("returns user profile with balance as number", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...makeUser(),
        balance: { toNumber: () => 99.5 } as unknown as number,
      });

      const profile = await service.getProfile("u1");

      expect(profile.id).toBe("u1");
      expect(typeof profile.balance).toBe("number");
    });
  });
});
