import { User } from "lucide-react";
import { ProfileForm } from "@/src/components/dashboard/profile-form";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";

export default async function AdminProfilePage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <AdminPageHeader
        eyebrow={t('pages.admin.profile.eyebrow')}
        title={t('pages.admin.profile.title')}
        description={t('pages.admin.profile.description')}
        icon={<User className="h-5 w-5" />}
      />
      <ProfileForm />
    </div>
  );
}
