import { ApiTags } from "@nestjs/swagger";
import {
  Body, Controller, Get, Param, Patch, Post, Query, UseGuards,
} from "@nestjs/common";
import { PayoutsService } from "./payouts.service";
import { RequestPayoutDto } from "./dto/request-payout.dto";
import { ProcessPayoutDto } from "./dto/process-payout.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole, PayoutStatus } from "@tours/db";

@ApiTags("Payouts")
@Controller()
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER, UserRole.ADMIN)
  @Post("payouts")
  async request(@CurrentUser() user: { id: string }, @Body() dto: RequestPayoutDto) {
    return this.payouts.request(user.id, dto);
  }

  @Get("payouts/my")
  async listMy(@CurrentUser() user: { id: string }) {
    return this.payouts.listMy(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("admin/payouts")
  async listAll(@Query("status") status?: PayoutStatus) {
    return this.payouts.listAll(status);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("admin/payouts/:id")
  async process(
    @Param("id") id: string,
    @Body() dto: ProcessPayoutDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.payouts.process(id, dto, admin.id);
  }
}
