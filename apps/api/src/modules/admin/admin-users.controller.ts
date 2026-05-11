import { ApiTags } from "@nestjs/swagger";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminUsersService } from "./admin-users.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "@tours/db";

@ApiTags("Admin")
@Controller("admin/users")
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  async list(
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.users.listAll({
      search,
      role,
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(100, Math.max(1, Number(pageSize) || 20)),
    });
  }
}
