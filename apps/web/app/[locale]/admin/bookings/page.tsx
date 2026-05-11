import { Mail } from "lucide-react";
import { AdminBookingsList } from "@/src/components/admin/admin-bookings-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";

export default function AdminBookingsPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Операции"
        title="Заявки"
        description="Главная рабочая зона. При смене статуса на «Оплачена» автоматически срабатывает триггер начисления реферального вознаграждения."
        icon={<Mail className="h-5 w-5" />}
      />
      <AdminBookingsList />
    </div>
  );
}
