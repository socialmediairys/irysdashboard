import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getPortalPreviewByClienteId } from "@/lib/portal-conteudos.functions";
import { ArrowLeft, Loader2 } from "lucide-react";
import { rememberMonth } from "@/components/content/MonthNav";
import { PortalConteudos } from "@/components/portal/PortalConteudosEditoriais";
import { PortalRico, type ClientePortal, type Fase, type Topico, type Conteudo } from "@/components/PortalRico";

/* ---------- Wrapper do admin: busca os dados e delega a UI ao PortalRico ---------- */
export function PortalPreview({ clienteId }: { clienteId: string }) {
  const [cliente, setCliente] = useState<ClientePortal | null>(null);
  const [fases, setFases] = useState<Fase[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mesAberto, setMesAberto] = useState<string | null>(null);

  const loadPreview = useServerFn(getPortalPreviewByClienteId);

  const load = async () => {
    if (!clienteId) return;
    setErro(null);
    try {
      const res = await loadPreview({ data: { clienteId } });
      setCliente(res.cliente);
      setFases(res.fases);
      setTopicos(res.topicos);
      setConteudos(res.conteudos);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar preview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setMesAberto(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  useEffect(() => {
    if (!clienteId) return;
    const channel = supabase
      .channel(`preview-conteudos-${clienteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conteudos_cliente", filter: `cliente_id=eq.${clienteId}` },
        () => { void load(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  if (loading && !cliente) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando preview…
      </div>
    );
  }
  if (erro) return <div className="text-sm text-destructive p-4">{erro}</div>;

  if (mesAberto) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setMesAberto(null)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
          <ArrowLeft size={16} /> Voltar ao planejamento
        </button>
        <PortalConteudos key={`${clienteId}:${mesAberto}`} clienteId={clienteId} initialMonth={mesAberto} />
      </div>
    );
  }

  return (
    <PortalRico
      cliente={cliente}
      fases={fases}
      topicos={topicos}
      conteudos={conteudos}
      variant="admin"
      onOpenMonth={(mes) => {
        rememberMonth(`portal:${clienteId}`, mes);
        setMesAberto(mes);
      }}
    />
  );
}
