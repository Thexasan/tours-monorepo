import { PageWrapper } from "@/src/widgets/layout/page-wrapper";

export default async function PublicHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <PageWrapper className="py-12">
      <h1 className="text-3xl font-semibold text-zinc-900">Traveling Tours ({locale.toUpperCase()})</h1>
      <p className="mt-3 text-zinc-600">
        Фаза 1 готова: базовая архитектура, API клиент, auth-store и i18n foundation подключены.
      </p>
    </PageWrapper>
  );
}
