import { MessageSquare } from "lucide-react";
import { AdminModerationList } from "@/src/components/admin/admin-moderation-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";

export default function AdminModerationPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Контент"
        title="Модерация отзывов"
        description="Одобряйте отзывы — они появятся на странице тура и в блоке «Последние отзывы» на главной."
        icon={<MessageSquare className="h-5 w-5" />}
      />
      <AdminModerationList />
    </div>
  );
}
