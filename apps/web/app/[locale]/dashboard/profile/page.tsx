import { User } from "lucide-react";
import { ProfileForm } from "@/src/components/dashboard/profile-form";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { MobileLogoutButton } from "@/src/components/shared/mobile-logout-button";

export default function DashboardProfilePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Личный кабинет"
        title="Профиль"
        description="Управляйте своими данными — они используются при бронировании туров."
        icon={<User className="h-5 w-5" />}
      />
      <ProfileForm />
      <MobileLogoutButton />
    </div>
  );
}
