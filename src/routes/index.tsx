import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel 360° — Thamirys" },
      { name: "description", content: "Sistema de gestão 360° para Social Media Managers." },
    ],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
      else navigate({ to: "/auth" });
    });
  }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] text-[#7A4A18]">
      Carregando...
    </div>
  );
}
