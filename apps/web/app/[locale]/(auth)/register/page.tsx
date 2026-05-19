import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/src/components/auth/register-form";
import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import Link from "next/link";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return (
    <PageWrapper className="py-12 max-w-md">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">{t("pageRegister.title")}</h1>
      <p className="text-zinc-600 mb-6">{t("pageRegister.subtitle")}</p>
      <RegisterForm />
      <p className="mt-6 text-sm text-zinc-600">
        {t("pageRegister.hasAccount")}{" "}
        <Link href={`/${locale}/login`} className="text-blue-600 hover:underline">
          {t("pageRegister.goLogin")}
        </Link>
      </p>
    </PageWrapper>
  );
}
