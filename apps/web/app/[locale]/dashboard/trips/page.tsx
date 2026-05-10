import { TripsList } from "@/src/components/dashboard/trips-list";

export default function DashboardTripsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Мои поездки</h1>
      <TripsList />
    </div>
  );
}
