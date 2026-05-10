import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { AdminShell } from "@/src/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageWrapper>
      <AdminShell>{children}</AdminShell>
    </PageWrapper>
  );
}
