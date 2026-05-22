import { User } from "lucide-react";
import { ProfileForm } from "@/src/components/dashboard/profile-form";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { MobileLogoutButton } from "@/src/components/shared/mobile-logout-button";
import { getTranslations } from "next-intl/server";

export default async function PartnerProfilePage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <PageHeader
        eyebrow={t('pages.partner.profile.eyebrow')}
        title={t('pages.partner.profile.title')}
        description={t('pages.partner.profile.description')}
        icon={<User className="h-5 w-5" />}
      />
      <ProfileForm />
      <MobileLogoutButton />
    </div>
  );
}
