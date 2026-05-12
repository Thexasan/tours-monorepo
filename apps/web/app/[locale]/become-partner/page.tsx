import { redirect } from "next/navigation";
// Страница "стать партнёром" удалена. Партнёрство теперь только по приглашению админа.
export default function Page() {
  redirect("/");
}
