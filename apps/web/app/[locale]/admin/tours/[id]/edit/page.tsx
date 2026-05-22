import { Briefcase } from "lucide-react";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { EditTourClient } from "./edit-tour-client";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditTourPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('dashboard');

  return (
    <div>
      <AdminPageHeader
        eyebrow={t('pages.admin.editTour.eyebrow')}
        title={t('pages.admin.editTour.title')}
        description={t('pages.admin.editTour.description')}
        icon={<Briefcase className="h-5 w-5" />}
      />
      <div className="mt-6">
        <EditTourClient tourId={id} />
      </div>
    </div>
  );
}
