import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw redirect({ to: "/auth" });
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    if (!roles?.some((r) => r.role === "admin")) {
      throw redirect({ to: "/meu-portal" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
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
