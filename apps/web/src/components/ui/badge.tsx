import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./card" // Reusing cn function

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold tracking-[0.01em] transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white",
        secondary: "bg-slate-100 text-slate-700",
        outline: "border-slate-200 text-slate-700 bg-white",
        teal: "bg-teal-50 text-teal-700 border-teal-100",
        rose: "bg-rose-50 text-rose-700 border-rose-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        sky: "bg-sky-50 text-sky-700 border-sky-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        destructive: "bg-red-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
