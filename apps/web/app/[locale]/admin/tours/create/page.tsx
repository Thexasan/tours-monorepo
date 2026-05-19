import { Briefcase } from "lucide-react";
import { TourFormWorkspace } from "@/src/components/admin/tour-form-workspace";
import { AdminPageHeader } from "@/src/components/admin/admin-page-header";

export default function CreateTourPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Каталог"
        title="Новый тур"
        description="Заполните информацию о туре. Он будет мгновенно скомпилирован в живую превью-карточку справа."
        icon={<Briefcase className="h-5 w-5" />}
      />
      <div className="mt-6">
        <TourFormWorkspace tour={null} />
      </div>
    </div>
  );
}
