import { UserCog } from "lucide-react";
import { AdminPartnerApplications } from "@/src/components/admin/admin-partner-applications";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";

export default function AdminPartnerApplicationsPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Партнёры"
        title="Заявки в партнёры"
        description="Одобряйте новых партнёров — они получат доступ к личному кабинету и реферальной программе."
        icon={<UserCog className="h-5 w-5" />}
      />
      <AdminPartnerApplications />
    </div>
  );
}
