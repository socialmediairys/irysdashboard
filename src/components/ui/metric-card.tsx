import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricTone = "primary" | "success" | "warning" | "danger" | "info";

/**
 * Icons are line art: monochrome outline, no colored fill or background.
 * Tones only shift the neutral text weight so hierarchy stays readable.
 */
const TONES: Record<MetricTone, string> = {
  primary: "text-foreground",
  success: "text-muted-foreground",
  warning: "text-muted-foreground",
  danger: "text-muted-foreground",
  info: "text-muted-foreground",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  delta,
  className,
  children,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: MetricTone;
  hint?: string;
  /** Percentage change; positive renders green with an up arrow. */
  delta?: number | null;
  className?: string;
  children?: ReactNode;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center",
              TONES[tone],
            )}
          >
            <Icon size={20} strokeWidth={1.6} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 truncate text-2xl font-bold text-foreground">{value}</div>
          <div className="mt-1 flex items-center gap-2">
            {delta != null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold",
                  up ? "text-success" : "text-destructive",
                )}
              >
                {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {up ? "+" : ""}
                {delta.toFixed(1)}%
              </span>
            )}
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          </div>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
