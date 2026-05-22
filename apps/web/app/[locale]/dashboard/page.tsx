import { LayoutDashboard } from "lucide-react";
import { DashboardHome } from "@/src/components/dashboard/dashboard-home";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { getTranslations } from "next-intl/server";

export default async function DashboardIndexPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <PageHeader
        title={t('pages.client.home.title')}
        description={t('pages.client.home.description')}
        icon={<LayoutDashboard className="h-5 w-5" />}
      />
      <DashboardHome />
    </div>
  );
}
