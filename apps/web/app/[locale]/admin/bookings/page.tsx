import { AdminBookingsList } from "@/src/components/admin/admin-bookings-list";

export default function AdminBookingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Заявки</h1>
      <p className="text-sm text-zinc-600 mb-6">
        Главная рабочая зона. Когда меняешь статус на <strong>Оплачена</strong> —
        автоматически срабатывает триггер начисления вознаграждения рефереру.
      </p>
      <AdminBookingsList />
    </div>
  );
}
