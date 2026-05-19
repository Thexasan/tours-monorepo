import { Briefcase } from "lucide-react";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";
import { EditTourClient } from "./edit-tour-client";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditTourPage({ params }: Props) {
  const { id } = await params;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Каталог"
        title="Редактирование тура"
        description="Внесите изменения в поля ниже. Превью-карточка справа моментально отобразит обновленный внешний вид."
        icon={<Briefcase className="h-5 w-5" />}
      />
      <div className="mt-6">
        <EditTourClient tourId={id} />
      </div>
    </div>
  );
}
