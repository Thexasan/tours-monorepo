import { User } from "lucide-react";
import { ProfileForm } from "@/src/components/dashboard/profile-form";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";

export default function AdminProfilePage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Аккаунт"
        title="Мой профиль"
        description="Управляйте своими личными данными."
        icon={<User className="h-5 w-5" />}
      />
      <ProfileForm />
    </div>
  );
}
