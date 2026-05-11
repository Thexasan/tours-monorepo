import { Wallet } from "lucide-react";
import { AdminPayoutsList } from "@/src/components/admin/admin-payouts-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";

export default function AdminPayoutsPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Финансы"
        title="Запросы на вывод"
        description="Подтверждайте после перевода в банке — или отклоняйте, и средства вернутся партнёру на баланс."
        icon={<Wallet className="h-5 w-5" />}
      />
      <AdminPayoutsList />
    </div>
  );
}
