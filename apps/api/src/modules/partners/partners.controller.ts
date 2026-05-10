import { ApiTags } from "@nestjs/swagger";
import {
  Body, Controller, Get, Param, Patch, Post, Query, UseGuards,
} from "@nestjs/common";
import { PartnersService } from "./partners.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ReviewApplicationDto } from "./dto/review-application.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole, PartnerApplicationStatus } from "@tours/db";

@ApiTags("Partners")
@Controller()
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @Post("partner-applications")
  async submit(@CurrentUser() user: { id: string }, @Body() dto: CreateApplicationDto) {
    return this.partners.submit(user.id, dto);
  }

  @Get("partner-applications/me")
  async myApplication(@CurrentUser() user: { id: string }) {
    return this.partners.getMyApplication(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("admin/partner-applications")
  async listAll(@Query("status") status?: PartnerApplicationStatus) {
    return this.partners.listAll(status);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("admin/partner-applications/:id")
  async review(
    @Param("id") id: string,
    @Body() dto: ReviewApplicationDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.partners.review(id, dto, admin.id);
  }
}
