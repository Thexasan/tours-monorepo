import { LayoutDashboard } from "lucide-react";
import { DashboardHome } from "@/src/components/dashboard/dashboard-home";
import { PageHeader } from "@/src/components/dashboard/page-header";

export default function DashboardIndexPage() {
  return (
    <div>
      <PageHeader
        title="Мой кабинет"
        description="Обзор ваших поездок, рефералов и активности"
        icon={<LayoutDashboard className="h-5 w-5" />}
      />
      <DashboardHome />
    </div>
  );
}
