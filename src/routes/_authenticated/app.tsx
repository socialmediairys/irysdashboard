import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppDispatch,
});

function AppDispatch() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Carregando...");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      const isAdmin = roles?.some((r) => r.role === "admin");
      if (isAdmin) {
        navigate({ to: "/admin/visao-geral" });
      } else {
        navigate({ to: "/portal" });
      }
      setMsg("Redirecionando...");
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] text-[#7A4A18]">
      {msg}
    </div>
  );
}
