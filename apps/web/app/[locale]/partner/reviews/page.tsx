import { MessageSquare } from "lucide-react";
import { MyReviewsList } from "@/src/components/dashboard/my-reviews-list";
import { PageHeader } from "@/src/components/dashboard/page-header";

export default function PartnerReviewsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Отзывы"
        title="Мои отзывы"
        description="Расскажите о впечатлениях — это помогает другим путешественникам."
        icon={<MessageSquare className="h-5 w-5" />}
      />
      <MyReviewsList basePath="partner" />
    </div>
  );
}
