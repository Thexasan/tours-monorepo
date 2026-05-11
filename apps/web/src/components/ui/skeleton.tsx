import { cn } from "@/src/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-lg tv-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
