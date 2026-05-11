"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";
import { Search, MapPin, Calendar, Users } from "lucide-react";

const searchSchema = z.object({
  destination: z.string().min(1, "Обязательное поле"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  guests: z.coerce.number().int().min(1).max(20),
});

type SearchInput = z.input<typeof searchSchema>;
type SearchOutput = z.output<typeof searchSchema>;

export function SearchForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("home.search");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchInput, unknown, SearchOutput>({
    resolver: zodResolver(searchSchema),
    defaultValues: { destination: "", guests: 1 },
  });

  const onSubmit: SubmitHandler<SearchOutput> = (values) => {
    const params = new URLSearchParams();
    if (values.destination) params.append("destination", values.destination);
    if (values.dateFrom) params.append("dateFrom", values.dateFrom);
    if (values.dateTo) params.append("dateTo", values.dateTo);
    if (values.guests) params.append("guests", String(values.guests));
    router.push(`/${locale}/tours?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_0.7fr_auto] gap-2 p-2 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)] ring-1 ring-slate-100"
    >
      <Field icon={<MapPin className="h-4 w-4 text-rose-500" />} label={t("destination", { fallback: "Куда едем?" })}>
        <input
          {...register("destination")}
          placeholder={t("destinationPlaceholder", { fallback: "Бали, Турция, Дубай…" })}
          className={`w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none ${errors.destination ? "text-rose-600" : ""}`}
        />
      </Field>

      <Field icon={<Calendar className="h-4 w-4 text-teal-600" />} label={t("dateFrom", { fallback: "Дата с" })}>
        <input
          type="date"
          {...register("dateFrom")}
          className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none"
        />
      </Field>

      <Field icon={<Calendar className="h-4 w-4 text-sky-600" />} label={t("dateTo", { fallback: "Дата по" })}>
        <input
          type="date"
          {...register("dateTo")}
          className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none"
        />
      </Field>

      <Field icon={<Users className="h-4 w-4 text-amber-500" />} label={t("guests", { fallback: "Гости" })}>
        <input
          type="number"
          min={1}
          max={20}
          {...register("guests")}
          className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none"
        />
      </Field>

      <Button type="submit" size="lg" className="md:h-full md:px-7">
        <Search className="w-4 h-4" />
        <span>{t("button", { fallback: "Найти" })}</span>
      </Button>
    </form>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-0.5 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-text">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
