import { getTranslations } from "next-intl/server";
import { NewReviewForm } from "@/src/components/dashboard/new-review-form";

export default async function NewReviewPage() {
  const t = await getTranslations("dashboard");
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
        {t("pages.client.newReview.title")}
      </h1>
      <p className="text-sm text-zinc-600 mb-6">
        {t("pages.client.newReview.description")}
      </p>
      <NewReviewForm />
    </div>
  );
}
