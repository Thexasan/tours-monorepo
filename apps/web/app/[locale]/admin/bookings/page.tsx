import { Mail } from "lucide-react";
import { AdminBookingsList } from "@/src/components/admin/admin-bookings-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";

export default async function AdminBookingsPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <AdminPageHeader
        eyebrow={t('pages.admin.bookings.eyebrow')}
        title={t('pages.admin.bookings.title')}
        description={t('pages.admin.bookings.description')}
        icon={<Mail className="h-5 w-5" />}
      />
      <AdminBookingsList />
    </div>
  );
}
