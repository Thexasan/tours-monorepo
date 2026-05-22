import { User } from "lucide-react";
import { ProfileForm } from "@/src/components/dashboard/profile-form";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { MobileLogoutButton } from "@/src/components/shared/mobile-logout-button";
import { getTranslations } from "next-intl/server";

export default async function DashboardProfilePage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <PageHeader
        eyebrow={t('pages.client.profile.eyebrow')}
        title={t('pages.client.profile.title')}
        description={t('pages.client.profile.description')}
        icon={<User className="h-5 w-5" />}
      />
      <ProfileForm />
      <MobileLogoutButton />
    </div>
  );
}
