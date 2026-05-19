import * as React from "react"

import { cn } from "@/src/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[15px] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-[color,box-shadow,border-color,background] duration-150 outline-none placeholder:text-slate-400 selection:bg-orange-100 selection:text-teal-900 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-slate-300",
        "focus-visible:border-orange-500 focus-visible:ring-4 focus-visible:ring-orange-500/15 focus-visible:bg-white",
        "aria-invalid:border-red-400 aria-invalid:ring-4 aria-invalid:ring-red-500/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
