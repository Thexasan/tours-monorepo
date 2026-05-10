import { LoginForm } from "@/src/components/auth/login-form";
import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import Link from "next/link";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <PageWrapper className="py-12 max-w-md">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Вход</h1>
      <p className="text-zinc-600 mb-6">Войди в свой аккаунт.</p>
      <LoginForm />
      <p className="mt-6 text-sm text-zinc-600">
        Нет аккаунта?{" "}
        <Link href={`/${locale}/register`} className="text-blue-600 hover:underline">
          Зарегистрируйся
        </Link>
      </p>
    </PageWrapper>
  );
}
