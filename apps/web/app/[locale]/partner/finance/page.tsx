import { PartnerFinance } from "@/src/components/partners/partner-finance";
import { getTranslations } from "next-intl/server";

export default async function PartnerFinancePage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">{t('pages.partner.finance.title')}</h1>
      <PartnerFinance />
    </div>
  );
}
