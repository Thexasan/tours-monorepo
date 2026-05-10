import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ToursModule } from "./modules/tours/tours.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { AdminModule } from "./modules/admin/admin.module";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 100 },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ToursModule,
    BookingsModule,
    AdminModule,
    // Day 4+: ReferralsModule, PartnersModule, ReviewsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
