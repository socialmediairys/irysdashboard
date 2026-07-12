import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

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
      throw redirect({ to: "/portal" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row" style={{ background: "#EDEAE5" }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto md:ml-60 transition-[margin] duration-200">
        <div className="mx-auto max-w-[1400px] p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
