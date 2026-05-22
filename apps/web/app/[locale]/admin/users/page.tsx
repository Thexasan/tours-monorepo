import { Users } from "lucide-react";
import { AdminUsersList } from "@/src/components/admin/admin-users-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";

export default async function AdminUsersPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <AdminPageHeader
        eyebrow={t('pages.admin.users.eyebrow')}
        title={t('pages.admin.users.title')}
        description={t('pages.admin.users.description')}
        icon={<Users className="h-5 w-5" />}
      />
      <AdminUsersList />
    </div>
  );
}
