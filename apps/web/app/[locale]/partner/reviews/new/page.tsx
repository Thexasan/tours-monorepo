import { NewReviewForm } from "@/src/components/dashboard/new-review-form";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { MessageSquare } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function PartnerNewReviewPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <PageHeader
        eyebrow={t('pages.partner.newReview.eyebrow')}
        title={t('pages.partner.newReview.title')}
        description={t('pages.partner.newReview.description')}
        icon={<MessageSquare className="h-5 w-5" />}
      />
      <NewReviewForm />
    </div>
  );
}
