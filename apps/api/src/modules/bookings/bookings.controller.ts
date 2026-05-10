import {
  Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { ListBookingsDto } from "./dto/list-bookings.dto";
import { Public } from "../auth/decorators/public.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { UserRole } from "@tours/db";

const REF_COOKIE = "tours_ref";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  /**
   * Создание заявки — публично доступно (гости тоже могут).
   * @Public пропускает глобальный JwtAuthGuard.
   * OptionalJwtAuthGuard опционально заполняет req.user, если токен валиден.
   */
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async create(
    @Body() dto: CreateBookingDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id?: string } | undefined)?.id;
    const referralCode = (req.cookies?.[REF_COOKIE] as string | undefined) ?? undefined;
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
      ?? req.ip
      ?? undefined;

    return this.bookings.create(dto, { userId, referralCode, ip });
  }

  /** Мои заявки. */
  @Get("my")
  async listMy(
    @CurrentUser() user: { id: string },
    @Query() query: ListBookingsDto,
  ) {
    return this.bookings.listMy(user.id, query);
  }

  /** Все заявки — только ADMIN. */
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async listAll(@Query() query: ListBookingsDto) {
    return this.bookings.listAll(query);
  }

  @Get(":id")
  async getById(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.bookings.getById(id, user);
  }

  /** Смена статуса — только ADMIN. */
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.bookings.updateStatus(id, dto, admin.id);
  }
}
