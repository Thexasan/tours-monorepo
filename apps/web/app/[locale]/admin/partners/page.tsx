import { UserCog } from "lucide-react";
import { AdminPartnersList } from "@/src/components/admin/admin-partners-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";

export default function AdminPartnersPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Партнёры"
        title="Управление партнёрами"
        description="Добавляйте партнёров вручную. Партнёр получает временный пароль на email и заходит в свой кабинет."
        icon={<UserCog className="h-5 w-5" />}
      />
      <AdminPartnersList />
    </div>
  );
}
