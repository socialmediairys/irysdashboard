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
      else navigate({ to: "/login" });
    });

  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      Carregando...
    </div>
  );
}
