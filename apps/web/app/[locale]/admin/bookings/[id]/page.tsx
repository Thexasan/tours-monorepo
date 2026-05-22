import { Mail } from "lucide-react";
import { AdminBookingWorkspace } from "@/src/components/admin/booking/AdminBookingWorkspace";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminBookingDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('dashboard');
  return (
    <div>
      <AdminPageHeader
        eyebrow={t('pages.admin.bookingDetail.eyebrow')}
        title={t('pages.admin.bookingDetail.title')}
        description={t('pages.admin.bookingDetail.description')}
        icon={<Mail className="h-5 w-5" />}
      />
      <AdminBookingWorkspace bookingId={id} />
    </div>
  );
}
