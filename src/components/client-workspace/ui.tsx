import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared, minimal building blocks for workspace tabs. */
export function WsSection({ title, description, action, children, className }: {
  title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string;
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
      <div className="rounded-lg border border-border bg-card">{children}</div>
    </section>
  );
}

export function WsEmpty({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-5 py-10 text-center">
      {title && <div className="text-sm font-medium text-foreground">{title}</div>}
      <div className={cn("text-sm text-muted-foreground", title && "mt-1")}>{children}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function WsRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-3 px-5 py-3", className)}>{children}</div>;
}

export function WsList({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-border">{children}</div>;
}

export function WsFact({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="px-5 py-4">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-base font-semibold text-foreground">{value}</div>
      {hint && <div className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export const btnOutline =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-accent";
