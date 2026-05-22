import { MessageSquare } from "lucide-react";
import { MyReviewsList } from "@/src/components/dashboard/my-reviews-list";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { getTranslations } from "next-intl/server";

export default async function PartnerReviewsPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <PageHeader
        eyebrow={t('pages.partner.reviews.eyebrow')}
        title={t('pages.partner.reviews.title')}
        description={t('pages.partner.reviews.description')}
        icon={<MessageSquare className="h-5 w-5" />}
      />
      <MyReviewsList basePath="partner" />
    </div>
  );
}
