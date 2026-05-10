import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { BecomePartnerForm } from "@/src/components/partners/become-partner-form";

export default function BecomePartnerPage() {
  return (
    <PageWrapper className="py-12 max-w-2xl">
      <h1 className="text-3xl font-bold text-zinc-900 mb-3">Стать партнёром</h1>
      <p className="text-zinc-600 mb-6">
        Если ты блогер, инфлюенсер или агент — получай <strong>5%</strong> с каждой продажи по своей ссылке.
        Заполни анкету ниже, мы рассмотрим заявку в течение 1–3 дней.
      </p>
      <BecomePartnerForm />
    </PageWrapper>
  );
}
