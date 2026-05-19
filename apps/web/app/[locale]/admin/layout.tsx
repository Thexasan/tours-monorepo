import { AdminShell } from "@/src/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
