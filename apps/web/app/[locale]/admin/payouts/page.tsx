import { Wallet } from "lucide-react";
import { AdminPayoutsList } from "@/src/components/admin/admin-payouts-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";

export default async function AdminPayoutsPage() {
  const t = await getTranslations('dashboard');
  return (
    <div>
      <AdminPageHeader
        eyebrow={t('pages.admin.payouts.eyebrow')}
        title={t('pages.admin.payouts.title')}
        description={t('pages.admin.payouts.description')}
        icon={<Wallet className="h-5 w-5" />}
      />
      <AdminPayoutsList />
    </div>
  );
}
