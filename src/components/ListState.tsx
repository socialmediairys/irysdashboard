import type { ReactNode } from "react";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonCards } from "@/components/ui/loading-state";

/**
 * Compatibility layer: the states now live in
 * `@/components/ui/empty-state` and `@/components/ui/loading-state`.
 * Existing imports keep working through these re-exports.
 */
export { EmptyState, ErrorState, Skeleton, SkeletonCards };

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
  skeletonVariant?: "card" | "row" | "table";
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
