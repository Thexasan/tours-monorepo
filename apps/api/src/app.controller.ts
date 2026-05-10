import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { Public } from "./modules/auth/decorators/public.decorator";

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get("health")
  async health(): Promise<{ status: string; db: string; timestamp: string }> {
    let dbStatus = "unknown";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = "ok";
    } catch (err) {
      dbStatus = `error: ${(err as Error).message}`;
    }
    return {
      status: "ok",
      db: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
