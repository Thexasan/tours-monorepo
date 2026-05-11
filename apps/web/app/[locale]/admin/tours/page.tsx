import { Briefcase } from "lucide-react";
import { AdminToursList } from "@/src/components/admin/admin-tours-list";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";

export default function AdminToursPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Каталог"
        title="Управление турами"
        description="Создавайте, редактируйте и публикуйте туры. Изменения сразу видны на сайте."
        icon={<Briefcase className="h-5 w-5" />}
      />
      <AdminToursList />
    </div>
  );
}
