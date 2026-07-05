import type { ReactNode } from "react";
import { RefreshCw, Plus, Inbox, AlertTriangle } from "lucide-react";

const C = {
  dark: "#2C1505",
  mid: "#7A4A18",
  gold: "#C9A46E",
  beige: "#E8D8C0",
  beigeLight: "#F5EEE5",
  textMid: "#7A6050",
  textMuted: "#BBA898",
};
const SHADOW = "0 2px 16px rgba(44,21,5,0.09)";

/** Skeleton block matching the beige palette. */
export function Skeleton({
  className = "",
  height = "1rem",
}: {
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: C.beigeLight, height }}
    />
  );
}

export function SkeletonCards({
  count = 3,
  variant = "card",
}: {
  count?: number;
  variant?: "card" | "row";
}) {
  const items = Array.from({ length: count });
  if (variant === "row") {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-[10px] p-3"
            style={{ background: C.beigeLight }}
          >
            <div className="flex-1 space-y-2 pr-4">
              <Skeleton height="0.9rem" className="w-2/3" />
              <Skeleton height="0.7rem" className="w-1/3" />
            </div>
            <Skeleton height="1.4rem" className="w-16" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      {items.map((_, i) => (
        <div
          key={i}
          className="rounded-[18px] p-6 bg-white"
          style={{ boxShadow: SHADOW }}
        >
          <div className="flex items-start gap-4">
            <Skeleton height="3.5rem" className="w-14" />
            <div className="flex-1 space-y-2">
              <Skeleton height="1rem" className="w-3/4" />
              <Skeleton height="0.75rem" className="w-1/2" />
              <Skeleton height="1rem" className="w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title = "Nada por aqui ainda",
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div
      className="rounded-[18px] bg-white p-8 md:p-10 text-center"
      style={{ boxShadow: SHADOW }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: C.beigeLight, color: C.mid }}
      >
        {icon ?? <Inbox size={24} />}
      </div>
      <div className="mt-4 font-extrabold text-lg" style={{ color: C.dark }}>
        {title}
      </div>
      {description && (
        <div className="mt-1 text-sm max-w-md mx-auto" style={{ color: C.textMid }}>
          {description}
        </div>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-[30px] px-5 py-2.5 text-sm font-semibold min-h-11"
          style={{ background: C.dark, color: "#fff", boxShadow: SHADOW }}
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
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-[18px] bg-white p-8 text-center"
      style={{ boxShadow: SHADOW }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "#FDECEA", color: "#C8351A" }}
      >
        <AlertTriangle size={24} />
      </div>
      <div className="mt-4 font-extrabold text-lg" style={{ color: C.dark }}>
        Não foi possível carregar
      </div>
      {message && (
        <div
          className="mt-1 text-sm max-w-md mx-auto break-words"
          style={{ color: C.textMid }}
        >
          {message}
        </div>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-[30px] px-5 py-2.5 text-sm font-semibold min-h-11"
          style={{
            background: "transparent",
            border: `1px solid ${C.beige}`,
            color: C.dark,
          }}
        >
          <RefreshCw size={14} /> Tentar novamente
        </button>
      )}
    </div>
  );
}

/**
 * Convenience wrapper: renders skeleton / error / empty / children based on
 * a Supabase list state. Pass a render function for the loaded content.
 */
export function ListState<T>({
  loading,
  error,
  rows,
  onRetry,
  emptyTitle,
  emptyDescription,
  actionLabel,
  onAction,
  skeletonVariant = "card",
  skeletonCount = 3,
  children,
}: {
  loading: boolean;
  error: string | null;
  rows: T[];
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  actionLabel?: string;
  onAction?: () => void;
  skeletonVariant?: "card" | "row";
  skeletonCount?: number;
  children: ReactNode;
}) {
  if (loading && rows.length === 0) {
    return <SkeletonCards count={skeletonCount} variant={skeletonVariant} />;
  }
  if (error && rows.length === 0) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={actionLabel}
        onAction={onAction}
      />
    );
  }
  return <>{children}</>;
}
