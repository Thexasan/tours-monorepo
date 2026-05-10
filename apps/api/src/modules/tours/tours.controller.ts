import { ApiTags } from "@nestjs/swagger";
import { Controller, Get, Param, Query } from "@nestjs/common";
import { ToursService } from "./tours.service";
import { ListToursDto } from "./dto/list-tours.dto";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Tours")
@Controller("tours")
export class ToursController {
  constructor(private readonly tours: ToursService) {}

  @Public()
  @Get()
  async list(@Query() query: ListToursDto) {
    return this.tours.list(query);
  }

  @Public()
  @Get(":slug")
  async getBySlug(@Param("slug") slug: string) {
    return this.tours.getBySlug(slug);
  }
}
