import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageWrapper>
        <DashboardShell>{children}</DashboardShell>
      </PageWrapper>
    </div>
  );
}
