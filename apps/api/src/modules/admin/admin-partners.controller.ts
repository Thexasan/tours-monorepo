import { ApiTags } from "@nestjs/swagger";
import {
  Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards,
} from "@nestjs/common";
import { AdminPartnersService } from "./admin-partners.service";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { UpdatePartnerDto } from "./dto/update-partner.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "@tours/db";

@ApiTags("Admin")
@Controller("admin/partners")
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPartnersController {
  constructor(private readonly partners: AdminPartnersService) {}

  /** Создать партнёра вручную. Возвращает партнёра (без пароля; пароль уходит на email). */
  @Post()
  async create(@Body() dto: CreatePartnerDto) {
    return this.partners.create(dto);
  }

  /** Список всех партнёров с метриками. */
  @Get()
  async list(
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.partners.listAll({
      search,
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(100, Math.max(1, Number(pageSize) || 20)),
    });
  }

  /** Обновить (имя, телефон, активен/нет). */
  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdatePartnerDto) {
    return this.partners.update(id, dto);
  }

  /** Сбросить пароль партнёру: генерится новый временный + уходит email. */
  @HttpCode(200)
  @Post(":id/reset-password")
  async resetPassword(@Param("id") id: string) {
    return this.partners.resetPassword(id);
  }
}
