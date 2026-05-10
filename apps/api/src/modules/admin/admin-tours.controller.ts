import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from "@nestjs/common";
import { AdminToursService } from "./admin-tours.service";
import { CreateTourDto } from "./dto/create-tour.dto";
import { UpdateTourDto } from "./dto/update-tour.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "@tours/db";

@Controller("admin/tours")
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminToursController {
  constructor(private readonly tours: AdminToursService) {}

  @Get()
  async list(@Query("includeInactive") includeInactive?: string) {
    return this.tours.listAll(includeInactive === "true");
  }

  @Post()
  async create(@Body() dto: CreateTourDto) {
    return this.tours.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateTourDto) {
    return this.tours.update(id, dto);
  }

  @Delete(":id")
  async archive(@Param("id") id: string) {
    return this.tours.archive(id);
  }
}
