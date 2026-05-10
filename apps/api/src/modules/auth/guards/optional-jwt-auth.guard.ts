import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Не блокирует анонимные запросы. Если access-токен валидный — заполняет req.user.
 * Используется для эндпоинтов, доступных гостям, но опционально учитывающих залогиненного пользователя
 * (например, создание заявки).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  // Override: всегда пропускаем; passport заполнит user, если токен валидный
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // Override: при ошибке — НЕ throw, просто возвращаем undefined (req.user останется пустым)
  handleRequest<TUser>(_err: Error | null, user: TUser | false): TUser | null {
    return user || null;
  }
}
