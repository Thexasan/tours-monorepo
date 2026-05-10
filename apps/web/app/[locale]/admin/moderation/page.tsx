import { AdminModerationList } from "@/src/components/admin/admin-moderation-list";

export default function AdminModerationPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Модерация отзывов</h1>
      <p className="text-sm text-zinc-600 mb-6">Одобряй отзывы — они появятся на странице тура и в блоке «Последние отзывы» на главной.</p>
      <AdminModerationList />
    </div>
  );
}
