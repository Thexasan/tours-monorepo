import { ProfileForm } from "@/src/components/dashboard/profile-form";

export default function DashboardProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Профиль</h1>
      <ProfileForm />
    </div>
  );
}
