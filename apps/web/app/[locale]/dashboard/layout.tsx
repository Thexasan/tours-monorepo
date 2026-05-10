import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageWrapper>
      <DashboardShell>{children}</DashboardShell>
    </PageWrapper>
  );
}
