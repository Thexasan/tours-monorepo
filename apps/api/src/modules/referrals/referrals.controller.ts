import { ApiTags } from "@nestjs/swagger";
import {
  Body, Controller, Get, Post, Req, UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { ReferralsService } from "./referrals.service";
import { TrackClickDto } from "./dto/track-click.dto";
import { Public } from "../auth/decorators/public.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "@tours/db";

@ApiTags("Referrals")
@Controller()
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Public()
  @Post("referrals/click")
  async trackClick(@Body() dto: TrackClickDto, @Req() req: Request) {
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
      ?? req.ip ?? undefined;
    const userAgent = req.headers["user-agent"] as string | undefined;
    return this.referrals.trackClick(dto, { ip, userAgent });
  }

  @Get("referrals/stats")
  async getStats(@CurrentUser() user: { id: string }) {
    return this.referrals.getStats(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER, UserRole.ADMIN)
  @Get("partner/stats")
  async getPartnerStats(@CurrentUser() user: { id: string }) {
    return this.referrals.getPartnerStats(user.id);
  }
}
