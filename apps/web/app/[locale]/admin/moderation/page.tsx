import { MessageSquare } from "lucide-react";
import { AdminModerationList } from "@/src/components/admin/admin-moderation-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";

export default async function AdminModerationPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <AdminPageHeader
        eyebrow={t('pages.admin.moderation.eyebrow')}
        title={t('pages.admin.moderation.title')}
        description={t('pages.admin.moderation.description')}
        icon={<MessageSquare className="h-5 w-5" />}
      />
      <AdminModerationList />
    </div>
  );
}
