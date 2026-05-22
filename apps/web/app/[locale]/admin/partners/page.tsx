import { UserCog } from "lucide-react";
import { AdminPartnersList } from "@/src/components/admin/admin-partners-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";

export default async function AdminPartnersPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <AdminPageHeader
        eyebrow={t('pages.admin.partners.eyebrow')}
        title={t('pages.admin.partners.title')}
        description={t('pages.admin.partners.description')}
        icon={<UserCog className="h-5 w-5" />}
      />
      <AdminPartnersList />
    </div>
  );
}
