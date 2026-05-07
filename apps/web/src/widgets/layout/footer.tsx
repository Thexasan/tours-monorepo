import { PageWrapper } from "@/src/widgets/layout/page-wrapper";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-zinc-200 bg-white py-6">
      <PageWrapper className="flex flex-col gap-2 text-sm text-zinc-600 md:flex-row md:justify-between">
        <span>© {new Date().getFullYear()} Traveling Tours</span>
        <span>support@traveling-tours.local</span>
      </PageWrapper>
    </footer>
  );
}
