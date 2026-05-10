import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { PartnerShell } from "@/src/components/partners/partner-shell";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <PageWrapper><PartnerShell>{children}</PartnerShell></PageWrapper>;
}
