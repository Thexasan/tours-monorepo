import { ApiTags } from "@nestjs/swagger";
import {
  Body, Controller, Get, Param, Patch, Post, Query, UseGuards,
} from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { ListReviewsDto } from "./dto/list-reviews.dto";
import { ModerateReviewDto } from "./dto/moderate-review.dto";
import { Public } from "../auth/decorators/public.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "@tours/db";

@ApiTags("Reviews")
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Публичный список — для главной и страницы тура (только APPROVED). */
  @Public()
  @Get("reviews")
  async listPublic(@Query() query: ListReviewsDto) {
    return this.reviews.listPublic(query);
  }

  @Post("reviews")
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto);
  }

  @Get("reviews/my")
  async listMy(@CurrentUser() user: { id: string }, @Query() query: ListReviewsDto) {
    return this.reviews.listMy(user.id, query);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("admin/reviews")
  async listAdmin(@Query() query: ListReviewsDto) {
    return this.reviews.listAdmin(query);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("admin/reviews/:id")
  async moderate(
    @Param("id") id: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.reviews.moderate(id, dto, admin.id);
  }
}
