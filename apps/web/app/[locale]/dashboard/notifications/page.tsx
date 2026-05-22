import { Bell } from "lucide-react";
import { NotificationsList } from "@/src/components/dashboard/notifications-list";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { getTranslations } from "next-intl/server";

export default async function DashboardNotificationsPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <PageHeader
        eyebrow={t('pages.client.notifications.eyebrow')}
        title={t('pages.client.notifications.title')}
        description={t('pages.client.notifications.description')}
        icon={<Bell className="h-5 w-5" />}
      />
      <NotificationsList />
    </div>
  );
}
