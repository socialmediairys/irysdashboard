import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Section with a plain title row and a bordered white surface. */
export function OverviewSection({
  title,
  description,
  action,
  children,
  className,
  bare,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Render children without the surrounding surface. */
  bare?: boolean;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {bare ? children : <div className="rounded-lg border border-border bg-card">{children}</div>}
    </section>
  );
}

export function EmptyLine({ children }: { children: ReactNode }) {
  return <div className="px-5 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}
