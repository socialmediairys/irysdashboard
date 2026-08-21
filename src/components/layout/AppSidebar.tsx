import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Menu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarItem = { to: string; label: string; icon: LucideIcon };
export type SidebarGroup = { label: string; items: SidebarItem[] };

export type SidebarCta = {
  title: string;
  description?: string;
  actionLabel: string;
  to: string;
};

export type SidebarUser = {
  name: string;
  subtitle?: string;
  avatarUrl?: string | null;
};

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * Light, collapsible sidebar shared by the admin area and the client portal.
 * Colors come exclusively from the sidebar/primary tokens.
 */
export function AppSidebar({
  brand,
  groups,
  backTo,
  backLabel = "Voltar",
  cta,
  user,
  footer,
}: {
  brand: string;
  groups: SidebarGroup[];
  backTo?: string;
  backLabel?: string;
  cta?: SidebarCta;
  user?: SidebarUser;
  footer?: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <span className="font-bold tracking-tight text-foreground">{brand}</span>
        <div className="w-10" />
      </header>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col justify-between border-r border-sidebar-border bg-sidebar py-3 transition-transform duration-200 md:transition-[width,transform]",
          collapsed ? "md:w-16" : "md:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="mb-2 hidden h-11 items-center gap-2 rounded-lg px-2.5 text-muted-foreground hover:bg-secondary md:flex"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <Menu size={18} />
            {!collapsed && (
              <span className="text-sm font-bold text-foreground">{brand}</span>
            )}
          </button>

          <div className="mb-2 flex h-10 items-center justify-between px-2 md:hidden">
            <span className="text-sm font-bold text-foreground">{brand}</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
              aria-label="Fechar menu"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          {backTo && (
            <Link
              to={backTo}
              className="mb-2 flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary"
            >
              <ArrowLeft size={16} className="shrink-0" />
              {!collapsed && backLabel}
            </Link>
          )}

          {groups.map((g) => (
            <div key={g.label} className="mt-2">
              {!collapsed && (
                <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {g.label}
                </div>
              )}
              {g.items.map((n) => {
                const Icon = n.icon;
                const isActive = pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? n.label : undefined}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors",
                      isActive
                        ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      collapsed && "md:justify-center",
                    )}
                  >
                    <Icon size={18} strokeWidth={2} className="shrink-0" />
                    <span className={cn("text-sm font-semibold", collapsed && "md:hidden")}>
                      {n.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="shrink-0 space-y-3 px-2 pt-3">
          {cta && !collapsed && (
            <div className="rounded-xl bg-primary p-4 text-primary-foreground">
              <Sparkles size={18} />
              <div className="mt-2 text-sm font-bold">{cta.title}</div>
              {cta.description && (
                <p className="mt-1 text-xs opacity-80">{cta.description}</p>
              )}
              <Link
                to={cta.to}
                onClick={() => setMobileOpen(false)}
                className="mt-3 inline-flex min-h-9 items-center rounded-full bg-card px-3 py-1.5 text-xs font-bold text-primary transition-opacity hover:opacity-90"
              >
                {cta.actionLabel}
              </Link>
            </div>
          )}

          {user && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-2",
                collapsed && "md:justify-center",
              )}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-accent-foreground">
                  {initialsOf(user.name)}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {user.name}
                  </div>
                  {user.subtitle && (
                    <div className="truncate text-xs text-muted-foreground">
                      {user.subtitle}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {footer}
        </div>
      </aside>
    </>
  );
}
