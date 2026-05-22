import { Plane } from "lucide-react";
import { TripsList } from "@/src/components/dashboard/trips-list";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { getTranslations } from "next-intl/server";

export default async function DashboardTripsPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <PageHeader
        eyebrow={t('pages.client.trips.eyebrow')}
        title={t('pages.client.trips.title')}
        description={t('pages.client.trips.description')}
        icon={<Plane className="h-5 w-5" />}
      />
      <TripsList />
    </div>
  );
}
