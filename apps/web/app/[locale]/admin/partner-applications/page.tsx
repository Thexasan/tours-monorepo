import { AdminPartnerApplications } from "@/src/components/admin/admin-partner-applications";

export default function AdminPartnerApplicationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Заявки в партнёры</h1>
      <AdminPartnerApplications />
    </div>
  );
}
