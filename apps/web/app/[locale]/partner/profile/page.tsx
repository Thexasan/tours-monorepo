import { User } from "lucide-react";
import { ProfileForm } from "@/src/components/dashboard/profile-form";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { MobileLogoutButton } from "@/src/components/shared/mobile-logout-button";

export default function PartnerProfilePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Аккаунт"
        title="Мой профиль"
        description="Управляйте своими личными данными."
        icon={<User className="h-5 w-5" />}
      />
      <ProfileForm />
      <MobileLogoutButton />
    </div>
  );
}
