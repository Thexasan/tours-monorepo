import * as React from "react";
import { cn } from "@/src/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "default" | "hero";
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
  variant = "default",
  className,
}: PageHeaderProps) {
  if (variant === "hero") {
    return (
      <header className={cn("tv-hero p-7 md:p-9 mb-6", className)}>
        <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-8">
          <div className="flex-1 min-w-0">
            {eyebrow && (
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/80 font-semibold">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-white">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-white/85 text-[15px] leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-linear-to-br from-teal-500 to-sky-600 text-white shadow-[0_8px_18px_-8px_rgba(13,148,136,0.6)]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-teal-700">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-slate-900 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-slate-500 text-[15px] leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
