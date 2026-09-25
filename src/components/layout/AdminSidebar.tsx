import { Link, useRouterState } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  LayoutDashboard,
  Users,
  Compass,
  FileText,
  KanbanSquare,
  TrendingUp,
  CreditCard,
  Library,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Extra path prefixes that should also mark this item as active. */
  match?: string[];
};

export const ADMIN_NAV: NavItem[] = [
  { to: "/admin/visao-geral", label: "Visão geral", icon: LayoutDashboard },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/estrategia", label: "Estratégia", icon: Compass },
  { to: "/admin/conteudo", label: "Conteúdo", icon: FileText, match: ["/admin/portal-conteudos"] },
  { to: "/admin/sprints", label: "Sprints", icon: KanbanSquare },
  { to: "/admin/crm", label: "Comercial", icon: TrendingUp },
  { to: "/admin/financeiro", label: "Financeiro", icon: CreditCard },
  { to: "/admin/biblioteca-midia", label: "Biblioteca", icon: Library },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3, match: ["/admin/metricas-sociais"] },
];

export const ADMIN_SETTINGS: NavItem = {
  to: "/admin/configuracoes",
  label: "Configurações",
  icon: Settings,
  match: ["/admin/equipe", "/admin/cadastros", "/admin/juridico", "/admin/agenda"],
};

function isActive(pathname: string, item: NavItem) {
  return [item.to, ...(item.match ?? [])].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const renderItem = (n: NavItem) => {
    const Icon = n.icon;
    const active = isActive(pathname, n);
    return (
      <Link
        key={n.to}
        to={n.to}
        onClick={onCloseMobile}
        title={collapsed ? n.label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors",
          active
            ? "bg-sidebar-accent font-medium text-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
          collapsed && "md:justify-center md:px-0",
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
        )}
        <Icon size={17} strokeWidth={1.6} className={cn("shrink-0", active && "text-primary")} />
        <span className={cn("truncate", collapsed && "md:hidden")}>{n.label}</span>
      </Link>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/30 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200",
          collapsed ? "md:w-16" : "md:w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center justify-between px-4", collapsed && "md:justify-center md:px-0")}>
          <Link to="/admin/visao-geral" className="flex items-center" onClick={onCloseMobile} aria-label="AIRYS — Visão geral">
            <BrandLogo className={cn("h-6", collapsed && "md:h-3.5")} />
          </Link>
          <button
            onClick={onCloseMobile}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent md:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} strokeWidth={1.6} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2" aria-label="Menu principal">
          {ADMIN_NAV.map(renderItem)}
        </nav>

        <div className="flex flex-col gap-0.5 border-t border-sidebar-border px-3 py-3">
          {renderItem(ADMIN_SETTINGS)}
          <button
            onClick={onToggleCollapsed}
            className={cn(
              "hidden h-9 items-center gap-3 rounded-md px-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground md:flex",
              collapsed && "md:justify-center md:px-0",
            )}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <PanelLeftOpen size={17} strokeWidth={1.6} /> : <PanelLeftClose size={17} strokeWidth={1.6} />}
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
