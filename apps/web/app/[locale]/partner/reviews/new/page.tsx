import { NewReviewForm } from "@/src/components/dashboard/new-review-form";
import { PageHeader } from "@/src/components/dashboard/page-header";
import { MessageSquare } from "lucide-react";

export default function PartnerNewReviewPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Отзывы"
        title="Написать отзыв"
        description="Отзыв можно оставить только на тур, который вы уже оплатили. Он будет опубликован после модерации."
        icon={<MessageSquare className="h-5 w-5" />}
      />
      <NewReviewForm />
    </div>
  );
}
