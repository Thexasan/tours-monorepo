import {
  Injectable, ConflictException, UnauthorizedException, BadRequestException,
  NotFoundException, Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { UserRole } from "@tours/db";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const REFERRAL_CODE_LENGTH = 8;

interface JwtPayloadShape { sub: string; email: string; role: UserRole; jti: string; }
export interface AuthTokens { accessToken: string; refreshToken: string; }

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  private normalizeEmail(email: string): string { return email.trim().toLowerCase(); }

  async register(dto: RegisterDto): Promise<{ userId: string; tokens: AuthTokens }> {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("Email already registered");

    let referrerId: string | undefined;
    if (dto.referralCode) {
      const code = dto.referralCode.trim().toUpperCase();
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: code }, select: { id: true, isActive: true },
      });
      if (referrer && referrer.isActive) referrerId = referrer.id;
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const referralCode = await this.generateUniqueReferralCode();

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim(),
        role: UserRole.CLIENT,
        referralCode,
        referrerId,
      },
      select: { id: true, email: true, role: true, fullName: true, referralCode: true },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    this.logger.log(`User registered: ${user.email}${referrerId ? ` (ref: ${referrerId})` : ""}`);

    // Welcome email (fire-and-forget — не блокируем регистрацию если email упал)
    void this.email.sendWelcome(user.email, user.fullName, user.referralCode).catch(() => undefined);

    return { userId: user.id, tokens };
  }

  async login(dto: LoginDto): Promise<{ userId: string; tokens: AuthTokens }> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`Login attempt: user not found for email=${email}`);
      throw new UnauthorizedException("Invalid credentials");
    }
    if (!user.isActive) {
      this.logger.warn(`Login attempt: deactivated account email=${email}`);
      throw new UnauthorizedException("Account deactivated");
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      this.logger.warn(`Login attempt: bad password email=${email}`);
      throw new UnauthorizedException("Invalid credentials");
    }
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    this.logger.log(`Login OK: ${user.email} (${user.role})`);
    return { userId: user.id, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) throw new UnauthorizedException("No refresh token");
    let payload: JwtPayloadShape;
    try {
      payload = await this.jwt.verifyAsync<JwtPayloadShape>(refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash }, include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired or revoked");
    }
    if (!stored.user.isActive) throw new UnauthorizedException("User deactivated");
    if (stored.userId !== payload.sub) throw new UnauthorizedException("Token mismatch");
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(stored.user.id, stored.user.email, stored.user.role);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken
      .updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } })
      .catch(() => undefined);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, fullName: true, avatarUrl: true, role: true,
        referralCode: true, referralCount: true, freeToursAvailable: true,
        balance: true, isPartnerApproved: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return { ...user, balance: Number(user.balance) };
  }

  private async issueTokens(userId: string, email: string, role: UserRole): Promise<AuthTokens> {
    const payload: JwtPayloadShape = { sub: userId, email, role, jti: randomBytes(16).toString("hex") };
    const accessOpts: JwtSignOptions = {
      secret: this.config.getOrThrow<string>("JWT_SECRET"),
      expiresIn: (this.config.get<string>("JWT_EXPIRES_IN") ?? "15m") as JwtSignOptions["expiresIn"],
    };
    const refreshOpts: JwtSignOptions = {
      secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: (this.config.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "7d") as JwtSignOptions["expiresIn"],
    };
    const accessToken = await this.jwt.signAsync(payload, accessOpts);
    const refreshToken = await this.jwt.signAsync(payload, refreshOpts);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: this.hashToken(refreshToken), expiresAt },
    });
    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private async generateUniqueReferralCode(maxAttempts = 10): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const code = this.randomReferralCode();
      const exists = await this.prisma.user.findUnique({
        where: { referralCode: code }, select: { id: true },
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
