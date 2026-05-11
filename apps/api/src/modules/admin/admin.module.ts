import { Module } from "@nestjs/common";
import { AdminToursService } from "./admin-tours.service";
import { AdminToursController } from "./admin-tours.controller";
import { AdminUsersService } from "./admin-users.service";
import { AdminUsersController } from "./admin-users.controller";

@Module({
  controllers: [AdminToursController, AdminUsersController],
  providers: [AdminToursService, AdminUsersService],
  exports: [AdminToursService],
})
export class AdminModule {}
