"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Search } from "lucide-react";

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
      className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-xl shadow-lg w-full max-w-5xl mx-auto items-start md:items-end"
    >
      <div className="w-full md:flex-1">
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          {t("destination", { fallback: "Куда едем?" })}
        </label>
        <Input
          {...register("destination")}
          placeholder={t("destinationPlaceholder", { fallback: "Страна, город или тур" })}
          className={errors.destination ? "border-red-500" : ""}
        />
      </div>

      <div className="w-full md:w-40">
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          {t("dateFrom", { fallback: "Дата с" })}
        </label>
        <Input type="date" {...register("dateFrom")} className="block w-full" />
      </div>

      <div className="w-full md:w-40">
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          {t("dateTo", { fallback: "Дата по" })}
        </label>
        <Input type="date" {...register("dateTo")} className="block w-full" />
      </div>

      <div className="w-full md:w-24">
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          {t("guests", { fallback: "Гости" })}
        </label>
        <Input type="number" min={1} max={20} {...register("guests")} />
      </div>

      <Button type="submit" className="w-full md:w-auto h-10 mt-1">
        <Search className="w-4 h-4 mr-2" />
        {t("button", { fallback: "Найти" })}
      </Button>
    </form>
  );
}
