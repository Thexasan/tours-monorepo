import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { PartnerShell } from "@/src/components/partners/partner-shell";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageWrapper>
        <PartnerShell>{children}</PartnerShell>
      </PageWrapper>
    </div>
  );
}
