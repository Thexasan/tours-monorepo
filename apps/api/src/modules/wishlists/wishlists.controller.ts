import { Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { WishlistsService } from "./wishlists.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Wishlists")
@Controller("wishlists")
export class WishlistsController {
  constructor(private readonly wishlists: WishlistsService) {}

  /** Список моего избранного — объявляется ПЕРВЫМ, иначе "my" попадёт в :tourId */
  @Get("my")
  listMy(@CurrentUser() user: { id: string }) {
    return this.wishlists.listMy(user.id);
  }

  /** Toggle: добавить/убрать тур из избранного */
  @Post(":tourId")
  toggle(@CurrentUser() user: { id: string }, @Param("tourId") tourId: string) {
    return this.wishlists.toggle(user.id, tourId);
  }

  /** Статус: в избранном или нет */
  @Get(":tourId/status")
  status(@CurrentUser() user: { id: string }, @Param("tourId") tourId: string) {
    return this.wishlists.getStatus(user.id, tourId);
  }
}
