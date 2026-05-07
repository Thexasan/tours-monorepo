import { notFound } from "next/navigation";

const supportedLocales = ["ru", "en", "tj"] as const;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!supportedLocales.includes(locale as (typeof supportedLocales)[number])) {
    notFound();
  }

  return children;
}
