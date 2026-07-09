import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMeuPortal } from "@/lib/portal-conteudos.functions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { PortalRico, type ClientePortal, type Fase, type Topico, type Conteudo } from "@/components/PortalRico";

export const Route = createFileRoute("/_authenticated/meu-portal")({
  head: () => ({
    meta: [
      { title: "Meu portal — Irys" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MeuPortalPage,
});

function MeuPortalPage() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<ClientePortal | null>(null);
  const [fases, setFases] = useState<Fase[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const loadMeuPortal = useServerFn(getMeuPortal);

  const load = async () => {
    setErro(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/login" });
        return;
      }
      const res = await loadMeuPortal();
      setCliente(res.cliente);
      setFases(res.fases);
      setTopicos(res.topicos);
      setConteudos(res.conteudos);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao carregar seu portal";
      // Cadastro ainda não ativo (ou sem cliente vinculado): mesmo comportamento
      // silencioso de antes — manda para /app em vez de mostrar tela de erro.
      if (message.includes("não está ativo") || message.includes("Nenhum portal encontrado")) {
        navigate({ to: "/app" });
        return;
      }
      setErro(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(load, 30000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cliente?.id) return;
    const channel = supabase
      .channel(`meu-portal-conteudos-${cliente.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conteudos_cliente", filter: `cliente_id=eq.${cliente.id}` },
        () => { void load(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (loading && !cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] text-[#7A4A18]">
        Carregando...
      </div>
    );
  }
  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-bold text-[#2C1505]">Erro ao abrir seu portal</h1>
          <p className="text-sm text-[#7A6050]">{erro}</p>
          <Button onClick={signOut} variant="outline">Sair</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEAE5]">
      <header className="bg-[#2C1505] text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-[#C9A46E]">Portal exclusivo</div>
          <h1 className="text-lg sm:text-xl font-extrabold break-words">{cliente?.nome}</h1>
          {cliente?.plano && (
            <div className="text-xs text-[#C9A46E]">Plano: {cliente.plano}</div>
          )}
        </div>
        <Button onClick={signOut} variant="ghost" size="sm" className="text-white hover:bg-[#7A4A18] shrink-0">
          <LogOut className="w-4 h-4 mr-1" /> Sair
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <PortalRico
          cliente={cliente}
          fases={fases}
          topicos={topicos}
          conteudos={conteudos}
          variant="cliente"
        />
      </main>
    </div>
  );
}
