import { Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.service.listMy(user.id);
  }

  @Patch("read-all")
  readAll(@CurrentUser() user: { id: string }) {
    return this.service.markAllRead(user.id);
  }

  @Patch(":id/read")
  read(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.service.markRead(user.id, id);
  }
}
