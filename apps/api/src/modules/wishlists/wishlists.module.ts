import { Module } from "@nestjs/common";
import { WishlistsService } from "./wishlists.service";
import { WishlistsController } from "./wishlists.controller";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [WishlistsController],
  providers: [WishlistsService],
  exports: [WishlistsService],
})
export class WishlistsModule {}
