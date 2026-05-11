import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { AdminShell } from "@/src/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageWrapper>
        <AdminShell>{children}</AdminShell>
      </PageWrapper>
    </div>
  );
}
