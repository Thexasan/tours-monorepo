import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  // Безопасность (но Swagger UI требует разрешения некоторых директив CSP)
  app.use(helmet({
    contentSecurityPolicy: false,  // Swagger inline JS
  }));
  app.use(cookieParser());

  // На проде фронт и API на разных доменах (Vercel + Render),
  // поэтому Express должен доверять прокси Render — иначе secure cookies не выставятся.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  // CORS
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(","),
    credentials: true,
  });

  // Serve locally uploaded files (dev fallback when BLOB_READ_WRITE_TOKEN is not set)
  const uploadsDir = join(process.cwd(), "uploads");
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  const express = app.getHttpAdapter().getInstance() as import("express").Express;
  express.use("/uploads", (await import("express")).static(uploadsDir));

  app.setGlobalPrefix("api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger UI
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Tours API")
    .setDescription("Туристическая реферальная платформа — REST API. Авторизация через httpOnly cookies (tours_access). В Swagger UI cookies подставляются автоматически после успешного логина через /auth/login.")
    .setVersion("1.0")
    .addCookieAuth("tours_access")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "JWT")
    .addTag("Auth", "Регистрация, логин, refresh, профиль")
    .addTag("Users", "Профиль пользователя")
    .addTag("Tours", "Каталог туров")
    .addTag("Bookings", "Заявки на туры")
    .addTag("Referrals", "Реферальные клики и статистика")
    .addTag("Partners", "Партнёрские заявки и B2B-кабинет")
    .addTag("Payouts", "Выплаты партнёрам")
    .addTag("Reviews", "Отзывы и модерация")
    .addTag("Admin", "Админ-операции")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/v1/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
  });

  // На Render и других PaaS нужно слушать 0.0.0.0, иначе health-check не достучится.
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  logger.log(`API listening on port ${port} (prefix /api/v1)`);
  logger.log(`Swagger UI available at /api/v1/docs`);
}
void bootstrap();
