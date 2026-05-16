import { Bell } from "lucide-react";
import { NotificationsList } from "@/src/components/dashboard/notifications-list";
import { PageHeader } from "@/src/components/dashboard/page-header";

export default function DashboardNotificationsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Личный кабинет"
        title="Уведомления"
        description="Обновления по вашим заявкам и поездкам."
        icon={<Bell className="h-5 w-5" />}
      />
      <NotificationsList />
    </div>
  );
}
