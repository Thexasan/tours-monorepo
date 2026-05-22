import { Briefcase } from "lucide-react";
import { AdminToursList } from "@/src/components/admin/admin-tours-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";

export default async function AdminToursPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <AdminPageHeader
        eyebrow={t('pages.admin.tours.eyebrow')}
        title={t('pages.admin.tours.title')}
        description={t('pages.admin.tours.description')}
        icon={<Briefcase className="h-5 w-5" />}
      />
      <AdminToursList />
    </div>
  );
}
