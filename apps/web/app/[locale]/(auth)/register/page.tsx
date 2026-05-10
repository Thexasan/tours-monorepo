import { RegisterForm } from "@/src/components/auth/register-form";
import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import Link from "next/link";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <PageWrapper className="py-12 max-w-md">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Регистрация</h1>
      <p className="text-zinc-600 mb-6">Создай аккаунт и получи свою реферальную ссылку.</p>
      <RegisterForm />
      <p className="mt-6 text-sm text-zinc-600">
        Уже есть аккаунт?{" "}
        <Link href={`/${locale}/login`} className="text-blue-600 hover:underline">
          Войти
        </Link>
      </p>
    </PageWrapper>
  );
}
