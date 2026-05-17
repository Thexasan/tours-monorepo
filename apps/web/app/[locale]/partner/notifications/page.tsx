import { Bell } from "lucide-react";
import { NotificationsList } from "@/src/components/dashboard/notifications-list";
import { PageHeader } from "@/src/components/dashboard/page-header";

export default function PartnerNotificationsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Кабинет"
        title="Уведомления"
        description="Обновления по заявкам, начисления комиссии и выплаты."
        icon={<Bell className="h-5 w-5" />}
      />
      <NotificationsList basePath="partner" />
    </div>
  );
}
