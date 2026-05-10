import { NewReviewForm } from "@/src/components/dashboard/new-review-form";

export default function NewReviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Написать отзыв</h1>
      <p className="text-sm text-zinc-600 mb-6">
        Отзыв можно оставить только на тур, который вы уже оплатили.
        Он будет опубликован после модерации админом.
      </p>
      <NewReviewForm />
    </div>
  );
}
