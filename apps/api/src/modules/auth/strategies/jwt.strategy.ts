import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { PrismaService } from "../../../prisma/prisma.service";

export interface JwtPayload {
  sub: string;   // userId
  email: string;
  role: string;
}

const cookieExtractor = (req: Request): string | null => {
  return (req?.cookies?.["tours_access"] as string) ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, email: true, role: true, isActive: true,
        fullName: true, avatarUrl: true,
        referralCode: true, referralCount: true, freeToursAvailable: true,
        balance: true, isPartnerApproved: true,
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or deactivated");
    }
    return user;
  }
}
