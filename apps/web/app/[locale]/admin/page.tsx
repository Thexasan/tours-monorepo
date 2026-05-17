import { LayoutDashboard } from "lucide-react";
import { AdminDashboard } from "@/src/components/admin/admin-dashboard";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";

export default function AdminIndexPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Панель управления"
        title="Обзор"
        description="Сводная статистика по заявкам, турам и партнёрским выплатам."
        icon={<LayoutDashboard className="h-5 w-5" />}
      />
      <AdminDashboard />
    </div>
  );
}
