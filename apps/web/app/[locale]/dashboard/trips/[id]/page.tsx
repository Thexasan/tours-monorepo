import { Plane } from "lucide-react";
import { TouristBookingWorkspace } from "@/src/components/dashboard/booking/TouristBookingWorkspace";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function DashboardTripDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('dashboard');
  return (
    <div>
      <PageHeader
        eyebrow={t('pages.client.tripDetail.eyebrow')}
        title={t('pages.client.tripDetail.title')}
        description={t('pages.client.tripDetail.description')}
        icon={<Plane className="h-5 w-5" />}
      />
      <TouristBookingWorkspace bookingId={id} />
    </div>
  );
}
