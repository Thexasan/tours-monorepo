import { AdminToursList } from "@/src/components/admin/admin-tours-list";

export default function AdminToursPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Управление турами</h1>
      <AdminToursList />
    </div>
  );
}
