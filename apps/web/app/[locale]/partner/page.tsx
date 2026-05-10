import { redirect } from "next/navigation";

export default async function PartnerIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/partner/dashboard`);
}
