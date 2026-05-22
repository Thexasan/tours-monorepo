import { Briefcase } from "lucide-react";
import { TourFormWorkspace } from "@/src/components/admin/tour-form-workspace";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";

export default async function CreateTourPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <AdminPageHeader
        eyebrow={t('pages.admin.createTour.eyebrow')}
        title={t('pages.admin.createTour.title')}
        description={t('pages.admin.createTour.description')}
        icon={<Briefcase className="h-5 w-5" />}
      />
      <div className="mt-6">
        <TourFormWorkspace tour={null} />
      </div>
    </div>
  );
}
