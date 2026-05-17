import * as React from "react";
import { cn } from "@/src/lib/utils";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-linear-to-br from-rose-500 to-rose-700 text-white shadow-[0_8px_18px_-8px_rgba(225,29,72,0.6)]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-rose-700">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-slate-900 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-slate-500 text-[15px] leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
