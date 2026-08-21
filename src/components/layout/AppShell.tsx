import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  AppSidebar,
  type SidebarCta,
  type SidebarGroup,
  type SidebarUser,
} from "./AppSidebar";

/**
 * Sidebar + scrollable content area. Screens render their own <PageHeader />
 * so they can attach page-specific actions.
 */
export function AppShell({
  brand,
  groups,
  backTo,
  backLabel,
  cta,
  user,
  aside,
  children,
  contentClassName,
}: {
  brand: string;
  groups: SidebarGroup[];
  backTo?: string;
  backLabel?: string;
  cta?: SidebarCta;
  user?: SidebarUser;
  /** Optional secondary panel (e.g. FilterSidebar) rendered beside content. */
  aside?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <AppSidebar
        brand={brand}
        groups={groups}
        backTo={backTo}
        backLabel={backLabel}
        cta={cta}
        user={user}
      />
      <div className="flex min-w-0 flex-1 md:ml-64">
        {aside && (
          <div className="hidden w-72 shrink-0 border-r border-border bg-card lg:block">
            {aside}
          </div>
        )}
        <main className={cn("min-w-0 flex-1", contentClassName)}>
          <div className="mx-auto max-w-[1400px] p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
