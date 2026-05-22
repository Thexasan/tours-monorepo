import { LayoutDashboard } from "lucide-react";
import { AdminDashboard } from "@/src/components/admin/admin-dashboard";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";

export default async function AdminIndexPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <AdminPageHeader
        eyebrow={t('pages.admin.home.eyebrow')}
        title={t('pages.admin.home.title')}
        description={t('pages.admin.home.description')}
        icon={<LayoutDashboard className="h-5 w-5" />}
      />
      <AdminDashboard />
    </div>
  );
}
