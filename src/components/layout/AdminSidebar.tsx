import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  CreditCard,
  Library,
  Scale,
  BarChart3,
  Menu,
  ArrowLeft,
  KanbanSquare,
} from "lucide-react";
import { useState } from "react";
import { C } from "@/components/Painel360";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Operação",
    items: [
      { to: "/admin/visao-geral", label: "Visão geral", icon: LayoutDashboard },
      { to: "/admin/cadastros", label: "Cadastros pendentes", icon: Users },
      { to: "/admin/equipe", label: "Equipe", icon: Users },
    ],
  },
  {
    label: "Produção",
    items: [
      { to: "/admin/sprint", label: "Sprint", icon: KanbanSquare },
      { to: "/admin/sprints", label: "Sprints (board)", icon: KanbanSquare },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { to: "/admin/portal-conteudos", label: "Gerenciar portais", icon: FileText },
      { to: "/admin/biblioteca-midia", label: "Biblioteca", icon: Library },
    ],
  },
  { label: "Comercial", items: [{ to: "/admin/crm", label: "Comercial", icon: TrendingUp }] },
  {
    label: "Financeiro",
    items: [
      { to: "/admin/financeiro", label: "Financeiro", icon: CreditCard },
      { to: "/admin/juridico", label: "Jurídico", icon: Scale },
    ],
  },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const width = collapsed ? "md:w-16" : "md:w-60";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile top bar */}
      <header
        className="md:hidden sticky top-0 z-20 flex h-14 items-center justify-between px-4 shrink-0"
        style={{ background: C.dark, color: "#fff" }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <span className="font-extrabold tracking-tight">Irys OS — Admin</span>
        <div className="w-10" />
      </header>

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-60 ${width} flex-col justify-between py-3 transition-transform md:transition-[width,transform] duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ background: C.dark }}
      >
        <div className="flex flex-col gap-1 overflow-y-auto px-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mb-2 hidden md:flex h-10 items-center gap-2 rounded-lg px-2 text-white/80 hover:bg-white/5"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <Menu size={18} />
            {!collapsed && <span className="text-sm font-bold">Irys OS — Admin</span>}
          </button>

          <div className="md:hidden mb-2 flex h-10 items-center justify-between px-2">
            <span className="text-sm font-bold text-white">Irys OS — Admin</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/5"
              aria-label="Fechar menu"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          <Link
            to="/app"
            className="mb-2 flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-white/70 hover:bg-white/5"
          >
            <ArrowLeft size={16} />
            {!collapsed && "Voltar ao painel"}
          </Link>

          {ADMIN_NAV_GROUPS.map((g) => (
            <div key={g.label} className="mt-2">
              {!collapsed && (
                <div
                  className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
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
                    className={`group relative flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors md:${collapsed ? "justify-center" : ""}`}
                    style={{
                      background: isActive ? C.gold : "transparent",
                      color: isActive ? C.dark : "rgba(255,255,255,0.85)",
                    }}
                  >
                    <Icon size={18} strokeWidth={2} className="shrink-0" />
                    <span className={`text-sm font-semibold ${collapsed ? "md:hidden" : ""}`}>
                      {n.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
