import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Response, Request } from "express";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import type { AuthTokens } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

const ACCESS_COOKIE = "tours_access";
const REFRESH_COOKIE = "tours_refresh";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!dto.referralCode && req.cookies?.tours_ref) {
      dto.referralCode = req.cookies.tours_ref as string;
    }
    const { userId, tokens } = await this.auth.register(dto);
    this.setAuthCookies(res, tokens);
    const profile = await this.auth.getProfile(userId);
    return { user: profile };
  }

  @Public()
  @HttpCode(200)
  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { userId, tokens } = await this.auth.login(dto);
    this.setAuthCookies(res, tokens);
    const profile = await this.auth.getProfile(userId);
    return { user: profile };
  }

  @Public()
  @HttpCode(200)
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const tokens = await this.auth.refresh(refreshToken ?? "");
    this.setAuthCookies(res, tokens);
    return { ok: true };
  }

  @HttpCode(200)
  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.auth.logout(refreshToken);
    this.clearAuthCookies(res);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { id: string }) {
    return this.auth.getProfile(user.id);
  }

  private setAuthCookies(res: Response, tokens: AuthTokens) {
    const isProd = this.config.get<string>("NODE_ENV") === "production";
    const baseOpts = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: isProd,
      path: "/",
    };
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...baseOpts,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...baseOpts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_COOKIE, { path: "/" });
  }
}
