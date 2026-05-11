import { cn } from "@/src/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow";
}

export function PageWrapper({ children, className, size = "default" }: PageWrapperProps) {
  const max =
    size === "wide" ? "max-w-7xl" : size === "narrow" ? "max-w-4xl" : "max-w-6xl";
  return (
    <div className={cn("mx-auto w-full px-4 md:px-6 lg:px-8", max, className)}>
      {children}
    </div>
  );
}
