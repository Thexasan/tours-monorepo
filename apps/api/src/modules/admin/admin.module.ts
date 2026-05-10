import { Module } from "@nestjs/common";
import { AdminToursService } from "./admin-tours.service";
import { AdminToursController } from "./admin-tours.controller";

@Module({
  controllers: [AdminToursController],
  providers: [AdminToursService],
  exports: [AdminToursService],
})
export class AdminModule {}
