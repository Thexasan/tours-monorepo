import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/src/components/auth/login-form";
import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import Link from "next/link";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return (
    <PageWrapper className="py-8 sm:py-14 flex justify-center">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-8 sm:px-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">{t("pageLogin.title")}</h1>
        <p className="text-slate-500 text-sm mb-6">{t("pageLogin.subtitle")}</p>
        <LoginForm />
        <p className="mt-5 text-sm text-slate-500 text-center">
          {t("pageLogin.noAccount")}{" "}
          <Link href={`/${locale}/register`} className="text-teal-700 font-medium hover:underline">
            {t("pageLogin.goRegister")}
          </Link>
        </p>
      </div>
    </PageWrapper>
  );
}
