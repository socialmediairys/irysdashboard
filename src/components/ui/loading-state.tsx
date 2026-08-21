import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  height = "1rem",
}: {
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-secondary", className)}
      style={{ height }}
    />
  );
}

export function SkeletonCards({
  count = 3,
  variant = "card",
}: {
  count?: number;
  variant?: "card" | "row" | "table";
}) {
  const items = Array.from({ length: count });

  if (variant === "row" || variant === "table") {
    return (
      <div className={variant === "table" ? "rounded-2xl bg-card p-2 shadow-card" : "space-y-3"}>
        {items.map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-between p-3",
              variant === "row" ? "rounded-xl bg-secondary" : "border-b border-border last:border-0",
            )}
          >
            <div className="flex flex-1 items-center gap-3 pr-4">
              <Skeleton height="2.25rem" className="w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton height="0.9rem" className="w-2/3" />
                <Skeleton height="0.7rem" className="w-1/3" />
              </div>
            </div>
            <Skeleton height="1.4rem" className="w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
      {items.map((_, i) => (
        <div key={i} className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-start gap-4">
            <Skeleton height="2.75rem" className="w-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton height="0.75rem" className="w-1/2" />
              <Skeleton height="1.25rem" className="w-3/4" />
              <Skeleton height="0.7rem" className="w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
