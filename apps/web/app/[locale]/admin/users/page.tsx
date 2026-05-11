import { Users } from "lucide-react";
import { AdminUsersList } from "@/src/components/admin/admin-users-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";

export default function AdminUsersPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Аудитория"
        title="Пользователи"
        description="Все зарегистрированные пользователи. Фильтрация по роли и поиск по имени или email."
        icon={<Users className="h-5 w-5" />}
      />
      <AdminUsersList />
    </div>
  );
}
