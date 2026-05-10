import { AdminPayoutsList } from "@/src/components/admin/admin-payouts-list";

export default function AdminPayoutsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Запросы на вывод</h1>
      <p className="text-sm text-zinc-600 mb-6">
        Партнёры запрашивают вывод средств. Подтверди после того, как сделаешь перевод в банке,
        или отклони — деньги вернутся партнёру на баланс.
      </p>
      <AdminPayoutsList />
    </div>
  );
}
