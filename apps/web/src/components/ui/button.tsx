import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/src/lib/utils"

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap transition-[transform,box-shadow,background,color] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-teal-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-teal-500 to-teal-600 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_20px_-8px_rgba(13,148,136,0.55)] hover:from-teal-500 hover:to-teal-700 hover:shadow-[0_2px_4px_rgba(15,23,42,0.10),0_14px_28px_-10px_rgba(13,148,136,0.65)]",
        accent:
          "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_20px_-8px_rgba(244,63,94,0.55)] hover:from-rose-500 hover:to-rose-700",
        sunset:
          "bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_20px_-8px_rgba(245,158,11,0.55)] hover:from-amber-400 hover:to-amber-600",
        destructive:
          "bg-red-600 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_20px_-8px_rgba(220,38,38,0.45)] hover:bg-red-700",
        outline:
          "border border-slate-200 bg-white text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        link:
          "text-teal-700 underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3.5",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-xl px-6 text-[15px] has-[>svg]:px-5",
        icon: "size-10",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
