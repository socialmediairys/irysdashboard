import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getPortalPreviewByClienteId } from "@/lib/portal-conteudos.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Headphones, FileText, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

type Fase = { id: number; nome: string; descricao: string | null };
type Topico = { id: string; fase_id: number; nome: string; ordem: number };
type ConteudoTipo = "video" | "audio" | "documento";
type Conteudo = { id: string; topico_id: string; tipo: ConteudoTipo; titulo: string | null; url: string | null };
type Cliente = { id: string; nome: string; plano: string | null; status: string; status_cadastro: string | null };

/**
 * Preview do portal do cliente (visão admin) — mesmos dados que o cliente vê,
 * carregados por clienteId. Atualiza em tempo real quando conteudos_cliente muda.
 */
export function PortalPreview({ clienteId }: { clienteId: string }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [fases, setFases] = useState<Fase[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [openFase, setOpenFase] = useState<number | null>(1);

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

  const conteudosPorTopico = useMemo(() => {
    const m: Record<string, Conteudo[]> = {};
    for (const c of conteudos) (m[c.topico_id] ??= []).push(c);
    return m;
  }, [conteudos]);

  const topicosPorFase = useMemo(() => {
    const m: Record<number, Topico[]> = {};
    for (const t of topicos) (m[t.fase_id] ??= []).push(t);
    return m;
  }, [topicos]);

  if (loading && !cliente) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando preview…
      </div>
    );
  }
  if (erro) {
    return <div className="text-sm text-destructive p-4">{erro}</div>;
  }

  return (
    <div className="rounded-xl bg-[#EDEAE5] p-3 sm:p-4 space-y-4">
      <div className="rounded-lg bg-[#2C1505] text-white px-4 py-3">
        <div className="text-[10px] uppercase tracking-widest text-[#C9A46E]">Preview · Portal exclusivo</div>
        <div className="text-base font-extrabold break-words">{cliente?.nome}</div>
        {cliente?.plano && <div className="text-xs text-[#C9A46E]">Plano: {cliente.plano}</div>}
      </div>

      <p className="text-xs text-[#7A6050]">
        Assim é o que o cliente vê ao entrar no portal. As <strong>6 fases da parceria</strong> abrem os conteúdos cadastrados na aba <em>Portal — Gerenciar conteúdo</em>.
      </p>

      {fases.map((fase) => {
        const isOpen = openFase === fase.id;
        const tps = topicosPorFase[fase.id] ?? [];
        const total = tps.reduce((s, t) => s + (conteudosPorTopico[t.id]?.length ?? 0), 0);
        return (
          <Card key={fase.id} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenFase(isOpen ? null : fase.id)}
              className="w-full text-left p-3 sm:p-4 flex items-center gap-3 hover:bg-[#F5EEE5] transition"
            >
              <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#2C1505] text-[#C9A46E] font-extrabold">
                {fase.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-[#7A6050]">Fase {fase.id}</div>
                <div className="font-bold text-[#2C1505] break-words text-sm">{fase.nome}</div>
              </div>
              <Badge variant="outline" className="shrink-0 border-[#C9A46E] text-[#7A4A18] text-[10px]">
                {total}
              </Badge>
              {isOpen ? <ChevronDown className="shrink-0 h-4 w-4 text-[#7A6050]" /> : <ChevronRight className="shrink-0 h-4 w-4 text-[#7A6050]" />}
            </button>
            {isOpen && (
              <div className="border-t border-[#E8D8C0] p-3 sm:p-4 space-y-3">
                {tps.length === 0 && <div className="text-xs text-[#7A6050]">Nenhum tópico configurado nesta fase.</div>}
                {tps.map((t) => {
                  const items = conteudosPorTopico[t.id] ?? [];
                  return (
                    <div key={t.id} className="min-w-0">
                      <div className="text-xs font-semibold text-[#2C1505] mb-1.5 break-words">{t.nome}</div>
                      {items.length === 0 ? (
                        <div className="text-[11px] text-[#7A6050] italic">Ainda não há conteúdos liberados aqui.</div>
                      ) : (
                        <ul className="space-y-1.5">
                          {items.map((c) => {
                            const Icon = c.tipo === "video" ? Video : c.tipo === "audio" ? Headphones : FileText;
                            const label = c.titulo || (c.tipo === "video" ? "Vídeo" : c.tipo === "audio" ? "Áudio" : "Documento");
                            return (
                              <li key={c.id} className="flex items-center gap-2 rounded-lg border border-[#E8D8C0] bg-white p-2 min-w-0">
                                <Icon className="shrink-0 h-3.5 w-3.5 text-[#7A4A18]" />
                                <span className="flex-1 text-xs text-[#2C1505] truncate min-w-0">{label}</span>
                                {c.url && (
                                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[11px] font-semibold text-[#7A4A18] underline">
                                    Abrir
                                  </a>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
