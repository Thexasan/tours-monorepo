import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { ToursCatalog } from "@/src/components/tours/tours-catalog";

export default function ToursCatalogPage() {
  return (
    <PageWrapper className="py-8">
      <h1 className="text-3xl font-semibold text-zinc-900 mb-6">Каталог туров</h1>
      <ToursCatalog />
    </PageWrapper>
  );
}
