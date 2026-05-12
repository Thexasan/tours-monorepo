import { Module } from "@nestjs/common";
import { AdminToursService } from "./admin-tours.service";
import { AdminToursController } from "./admin-tours.controller";
import { AdminUsersService } from "./admin-users.service";
import { AdminUsersController } from "./admin-users.controller";
import { AdminPartnersService } from "./admin-partners.service";
import { AdminPartnersController } from "./admin-partners.controller";

@Module({
  controllers: [AdminToursController, AdminUsersController, AdminPartnersController],
  providers: [AdminToursService, AdminUsersService, AdminPartnersService],
  exports: [AdminToursService],
})
export class AdminModule {}
