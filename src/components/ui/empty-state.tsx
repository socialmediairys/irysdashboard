import type { ReactNode } from "react";
import { Inbox, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title = "Nada por aqui ainda",
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-2xl bg-card p-8 text-center shadow-card md:p-10", className)}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-accent-foreground">
        {icon ?? <Inbox size={24} />}
      </div>
      <div className="mt-4 text-lg font-bold text-foreground">{title}</div>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover active:bg-primary-active"
        >
          <Plus size={14} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl bg-card p-8 text-center shadow-card", className)}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <AlertTriangle size={24} />
      </div>
      <div className="mt-4 text-lg font-bold text-foreground">Não foi possível carregar</div>
      {message && (
        <p className="mx-auto mt-1 max-w-md break-words text-sm text-muted-foreground">
          {message}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          <RefreshCw size={14} /> Tentar novamente
        </button>
      )}
    </div>
  );
}
