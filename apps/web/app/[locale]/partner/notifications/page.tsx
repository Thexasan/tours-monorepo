import { Bell } from "lucide-react";
import { NotificationsList } from "@/src/components/dashboard/notifications-list";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { getTranslations } from "next-intl/server";

export default async function PartnerNotificationsPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <PageHeader
        eyebrow={t('pages.partner.notifications.eyebrow')}
        title={t('pages.partner.notifications.title')}
        description={t('pages.partner.notifications.description')}
        icon={<Bell className="h-5 w-5" />}
      />
      <NotificationsList basePath="partner" />
    </div>
  );
}
