import { getTranslations } from "next-intl/server";
import { PartnerDashboard } from "@/src/components/partners/partner-dashboard";

export default async function PartnerDashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">{t("partner.dashboard.pageTitle")}</h1>
      <PartnerDashboard />
    </div>
  );
}
