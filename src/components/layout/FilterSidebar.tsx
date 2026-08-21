import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FilterSidebar({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 p-5", className)}>
      {title && (
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function FilterSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </section>
  );
}

export function FilterOption({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-10 w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-sm transition-colors",
        active
          ? "bg-primary-soft font-semibold text-accent-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      {count != null && (
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {count}
        </span>
      )}
    </button>
  );
}
