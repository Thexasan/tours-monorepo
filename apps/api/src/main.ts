import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  // Безопасность (но Swagger UI требует разрешения некоторых директив CSP)
  app.use(helmet({
    contentSecurityPolicy: false,  // Swagger inline JS
  }));
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(","),
    credentials: true,
  });

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

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}/api/v1`);
  logger.log(`Swagger UI:      http://localhost:${port}/api/v1/docs`);
}
void bootstrap();
