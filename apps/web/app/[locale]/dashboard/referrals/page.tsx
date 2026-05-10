import { ReferralsPanel } from "@/src/components/dashboard/referrals-panel";

export default function ReferralsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Реферальная программа</h1>
      <p className="text-zinc-600 mb-6">Приглашай друзей и получай бесплатные туры.</p>
      <ReferralsPanel />
    </div>
  );
}
