import { MyReviewsList } from "@/src/components/dashboard/my-reviews-list";

export default function MyReviewsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Мои отзывы</h1>
      <MyReviewsList />
    </div>
  );
}
