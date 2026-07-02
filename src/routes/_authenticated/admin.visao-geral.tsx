import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Painel360 from "@/components/Painel360";
import { supabase } from "@/integrations/supabase/client";
import { Scale } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/visao-geral")({
  component: AdminGate,
});

function AdminGate() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return navigate({ to: "/auth" });
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      if (roles?.some((r) => r.role === "admin")) setStatus("ok");
      else setStatus("denied");
    })();
  }, [navigate]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] text-[#7A4A18]">
        Verificando permissões...
      </div>
    );
  }
  if (status === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#EDEAE5] text-[#2C1505] gap-4">
        <h1 className="text-xl font-bold">Acesso restrito a administradores</h1>
        <button
          onClick={() => navigate({ to: "/portal" })}
          className="px-4 py-2 rounded bg-[#2C1505] text-white cursor-pointer"
        >
          Ir para o Portal do Cliente
        </button>
      </div>
    );
  }
  return <Painel360 />;
}
