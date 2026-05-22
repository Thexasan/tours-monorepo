import { Plane } from "lucide-react";
import { TripsList } from "@/src/components/dashboard/trips-list";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { getTranslations } from "next-intl/server";

export default async function PartnerTripsPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <PageHeader
        eyebrow={t('pages.partner.trips.eyebrow')}
        title={t('pages.partner.trips.title')}
        description={t('pages.partner.trips.description')}
        icon={<Plane className="h-5 w-5" />}
      />
      <TripsList basePath="partner" />
    </div>
  );
}
