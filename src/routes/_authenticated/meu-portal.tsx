import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMeuPortal } from "@/lib/portal-conteudos.functions";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Route as Route2, LayoutGrid, CheckCircle2, BarChart3 } from "lucide-react";
import { PortalAprovacoes, PortalConteudos, PortalResultados } from "@/components/portal/PortalConteudosEditoriais";
import { rememberMonth } from "@/components/content/MonthNav";
import { PortalRico, type ClientePortal, type Fase, type Topico, type Conteudo } from "@/components/PortalRico";
import { PortalContratoSuporte } from "@/components/PortalContratoSuporte";

const TABS = ["jornada", "conteudos", "aprovacoes", "resultados", "contrato"] as const;
type PortalTab = (typeof TABS)[number];

export const Route = createFileRoute("/_authenticated/meu-portal")({
  validateSearch: (s: Record<string, unknown>): { tab?: PortalTab; mes?: string } => {
    const tab = TABS.includes(s.tab as PortalTab) && s.tab !== "jornada" ? s.tab as PortalTab : undefined;
    const mes = tab === "conteudos" && typeof s.mes === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s.mes) ? s.mes : undefined;
    return { ...(tab ? { tab } : {}), ...(mes ? { mes } : {}) };
  },
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
  const queryClient = useQueryClient();
  // aba na URL: recarregar, voltar e links diretos mantêm o contexto do Portal
  const search = Route.useSearch();
  const tab: PortalTab = search.tab ?? "jornada";
  const setTab = (t: PortalTab) => void navigate({ to: "/meu-portal", search: t === "jornada" ? {} : { tab: t } });
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
      const message = e instanceof Error ? e.message : "";
      // Cadastro ainda não ativo (ou sem cliente vinculado): mesmo comportamento
      // silencioso de antes — manda para /app em vez de mostrar tela de erro.
      if (message.includes("não está ativo") || message.includes("Nenhum portal encontrado")) {
        navigate({ to: "/app" });
        return;
      }
      console.error("[meu-portal] load error:", e);
      setErro("Não foi possível carregar seu portal. Tente novamente.");

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
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  if (loading && !cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Carregando...
      </div>
    );
  }
  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-bold text-foreground">Erro ao abrir seu portal</h1>
          <p className="text-sm text-muted-foreground">{erro}</p>
          <Button onClick={signOut} variant="outline">Sair</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Portal exclusivo</div>
          <h1 className="break-words text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {cliente?.nome}
          </h1>
          {cliente?.plano && (
            <div className="text-xs text-muted-foreground">Plano: {cliente.plano}</div>
          )}
        </div>
        <Button onClick={signOut} variant="outline" size="sm" className="shrink-0">
          <LogOut className="mr-1 h-4 w-4" strokeWidth={1.6} /> Sair
        </Button>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 sm:px-6" aria-label="Seções do portal">
        {(
          [
            { k: "jornada", label: "Início", icon: Route2 },
            { k: "conteudos", label: "Conteúdos", icon: LayoutGrid },
            { k: "aprovacoes", label: "Aprovações", icon: CheckCircle2 },
            { k: "resultados", label: "Resultados", icon: BarChart3 },
            { k: "contrato", label: "Arquivos", icon: FileText },
          ] as const
        ).map(({ k, label, icon: Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              tab === k
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.6} />
            {label}
          </button>
        ))}
      </nav>

      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        {tab === "jornada" ? (
          <PortalRico
            cliente={cliente}
            fases={fases}
            topicos={topicos}
            conteudos={conteudos}
            variant="cliente"
            onOpenMonth={(mes) => { if (cliente?.id) rememberMonth(`portal:${cliente.id}`, mes); void navigate({ to: "/meu-portal", search: { tab: "conteudos", mes } }); }}
          />
        ) : !cliente?.id ? null : tab === "conteudos" ? (
          <PortalConteudos clienteId={cliente.id} initialMonth={search.mes} />
        ) : tab === "aprovacoes" ? (
          <PortalAprovacoes clienteId={cliente.id} />
        ) : tab === "resultados" ? (
          <PortalResultados clienteId={cliente.id} />
        ) : (
          <PortalContratoSuporte clienteId={cliente.id} />
        )}
      </main>
    </div>
  );
}
