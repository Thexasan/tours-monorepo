import { MessageSquare } from "lucide-react";
import { MyReviewsList } from "@/src/components/dashboard/my-reviews-list";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { getTranslations } from "next-intl/server";

export default async function MyReviewsPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <PageHeader
        eyebrow={t('pages.client.reviews.eyebrow')}
        title={t('pages.client.reviews.title')}
        description={t('pages.client.reviews.description')}
        icon={<MessageSquare className="h-5 w-5" />}
      />
      <MyReviewsList />
    </div>
  );
}
