import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { cn } from "@/lib/utils";
import { canAccess, staffRoles } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw redirect({ to: "/auth" });
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const list = (roles ?? []).map((r) => r.role as string);
    // Painel = só equipe interna; clientes vão para o Portal, sem perfil vão para /app
    if (!staffRoles(list).length) {
      throw redirect({ to: list.includes("cliente") ? "/meu-portal" : "/app" });
    }
    // seção fora das permissões do perfil → Visão geral (todos os perfis internos acessam)
    if (!canAccess(location.pathname, list)) {
      throw redirect({ to: "/admin/visao-geral" });
    }
    return { roles: list };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { roles } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setCollapsed(localStorage.getItem("irys.sidebar.collapsed") === "1");
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem("irys.sidebar.collapsed", c ? "0" : "1");
      return !c;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar
        roles={roles}
        collapsed={collapsed}
        onToggleCollapsed={toggle}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[margin] duration-200",
          collapsed ? "md:ml-16" : "md:ml-60",
        )}
      >
        <AdminTopbar onOpenMobile={() => setMobileOpen(true)} />
        <main ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1360px] px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
