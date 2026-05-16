import { Mail } from "lucide-react";
import { AdminBookingWorkspace } from "@/src/components/admin/booking/AdminBookingWorkspace";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminBookingDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div>
      <AdminPageHeader
        eyebrow="Заявки"
        title="Рабочее пространство"
        description="Управление документами и статусами по конкретной заявке."
        icon={<Mail className="h-5 w-5" />}
      />
      <AdminBookingWorkspace bookingId={id} />
    </div>
  );
}
