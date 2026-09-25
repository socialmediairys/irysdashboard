import { ReporteiMetrics, periodRange } from "@/components/metricas/ReporteiMetrics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Film, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_VARIANT, cdb, fmtShort, signedUrl, type ContentStatus } from "@/lib/content";
import { cn } from "@/lib/utils";

type VMidia = { bucket: string; storage_path: string; tipo: string; ordem: number; url?: string };
type Versao = { id: string; numero: number; legenda: string | null; hashtags: string | null; midias: VMidia[]; status: string; status_arte: string; status_legenda: string; enviada_em: string };
type Item = { id: string; titulo: string; canal: string | null; formato: string | null; data_prevista: string | null; status: ContentStatus; versao_atual: number; publicacao_url: string | null; publicado_em: string | null; versoes: Versao[]; comentarios: Coment[] };
type Coment = { id: string; texto: string; alvo: string; autor_id: string | null; created_at: string; versao_id: string | null };

/** Tudo aqui é lido direto do banco com as regras do cliente: só conteúdos enviados, versões enviadas e comentários do tipo "cliente". */
async function load(clienteId: string): Promise<Item[]> {
  const { data, error } = await cdb("conteudos")
    .select("id,titulo,canal,formato,data_prevista,status,versao_atual,publicacao_url,publicado_em,versoes:conteudo_versoes(id,numero,legenda,hashtags,midias,status,status_arte,status_legenda,enviada_em),comentarios:conteudo_comentarios(id,texto,alvo,autor_id,created_at,versao_id)")
    .eq("cliente_id", clienteId).order("data_prevista", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data ?? []) as Item[]).map((c) => ({ ...c, versoes: [...c.versoes].sort((a, b) => b.numero - a.numero), comentarios: [...(c.comentarios ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)) }));
}
export function useClientContents(clienteId: string) {
  return useQuery({ queryKey: ["portal-conteudos", clienteId], queryFn: () => load(clienteId) });
}

const current = (c: Item) => c.versoes.find((v) => v.numero === c.versao_atual) ?? c.versoes[0];
const pending = (c: Item) => ["com_cliente", "alteracao_solicitada"].includes(c.status);

export function PortalAprovacoes({ clienteId }: { clienteId: string }) {
  const { data = [], isLoading } = useClientContents(clienteId);
  const list = data.filter(pending);
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!list.length) return <Empty>Nenhum conteúdo aguardando sua aprovação.</Empty>;
  return <div className="space-y-8">{list.map((c) => <ApprovalCard key={c.id} c={c} clienteId={clienteId} />)}</div>;
}

export function PortalConteudos({ clienteId }: { clienteId: string }) {
  const { data = [], isLoading } = useClientContents(clienteId);
  const [open, setOpen] = useState<string | null>(null);
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!data.length) return <Empty>Os conteúdos aparecem aqui assim que forem enviados para você.</Empty>;
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {data.map((c) => (
        <div key={c.id}>
          <button onClick={() => setOpen(open === c.id ? null : c.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-accent/50">
            <span className="w-16 shrink-0 text-[13px] text-muted-foreground">{fmtShort(c.data_prevista)}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{c.titulo || "Conteúdo"}</span>
            <span className="hidden text-[13px] text-muted-foreground sm:inline">{[c.canal, c.formato].filter(Boolean).join(" · ")}</span>
            <StatusBadge variant={CONTENT_STATUS_VARIANT[c.status]}>{CONTENT_STATUS_LABEL[c.status]}</StatusBadge>
          </button>
          {open === c.id && current(c) && <div className="space-y-5 border-t border-border p-5"><VersionView v={current(c)!} /><Conversa c={c} /></div>}
        </div>
      ))}
    </div>
  );
}

export function PortalResultados({ clienteId }: { clienteId: string }) {
  const { data = [], isLoading } = useClientContents(clienteId);
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const pub = data.filter((c) => c.status === "publicado");
  const stat = (l: string, v: number) => <div className="px-5 py-4"><div className="text-[13px] text-muted-foreground">{l}</div><div className="mt-1 text-2xl font-semibold text-foreground">{v}</div></div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-card">
        {stat("Publicados", pub.length)}{stat("Aprovados", data.filter((c) => ["aprovado", "agendado"].includes(c.status)).length)}{stat("Aguardando você", data.filter(pending).length)}
      </div>
      {pub.length ? (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {pub.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3">
              <span className="w-16 text-[13px] text-muted-foreground">{c.publicado_em ? new Date(c.publicado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : fmtShort(c.data_prevista)}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{c.titulo}</span>
              {c.publicacao_url && <a href={c.publicacao_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">Ver <ExternalLink size={12} /></a>}
            </div>
          ))}
        </div>
      ) : <Empty>Nenhuma publicação ainda.</Empty>}
      <ReporteiMetrics start={periodRange(30).start} end={periodRange(30).end} hideWhenUnlinked />
    </div>
  );
}

function ApprovalCard({ c, clienteId }: { c: Item; clienteId: string }) {
  const v = current(c);
  const qc = useQueryClient();
  const [historico, setHistorico] = useState(false);
  if (!v) return null;
  const avaliar = async (parte: "arte" | "legenda", decisao: "aprovado" | "alteracao_solicitada", comentario?: string) => {
    const { error } = await supabase.rpc("cliente_avaliar_conteudo" as never, { _versao_id: v.id, _parte: parte, _decisao: decisao, _comentario: comentario ?? null } as never);
    if (error) { toast.error(error.message.includes("Comentário") ? "Escreva o que precisa mudar." : "Não foi possível registrar. Tente de novo."); return false; }
    toast.success(decisao === "aprovado" ? "Aprovado." : "Pedido de alteração enviado.");
    qc.invalidateQueries({ queryKey: ["portal-conteudos", clienteId] });
    return true;
  };
  const antigas = c.versoes.filter((x) => x.numero !== v.numero);
  return (
    <article className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">{c.titulo || "Conteúdo"}</h3>
          <p className="text-[13px] text-muted-foreground">{[c.canal, c.formato, fmtShort(c.data_prevista)].filter(Boolean).join(" · ")} · Versão {v.numero}</p>
        </div>
        <StatusBadge variant={CONTENT_STATUS_VARIANT[c.status]}>{CONTENT_STATUS_LABEL[c.status]}</StatusBadge>
      </header>
      <div className="grid gap-6 p-5 md:grid-cols-2">
        <div className="space-y-3">
          <Media midias={v.midias} />
          <Decision label="Arte" state={v.status_arte} onDecide={(d, t) => avaliar("arte", d, t)} />
        </div>
        <div className="space-y-3">
          <div className="whitespace-pre-wrap rounded-md border border-border p-4 text-sm leading-relaxed text-foreground">{v.legenda || <span className="text-muted-foreground">Sem legenda.</span>}{v.hashtags && <div className="mt-3 text-muted-foreground">{v.hashtags}</div>}</div>
          <Decision label="Legenda" state={v.status_legenda} onDecide={(d, t) => avaliar("legenda", d, t)} />
        </div>
      </div>
      {c.comentarios.length > 0 && <div className="border-t border-border px-5 py-4"><Conversa c={c} /></div>}
      {antigas.length > 0 && (
        <div className="border-t border-border px-5 py-3">
          <button onClick={() => setHistorico(!historico)} className="text-[13px] text-muted-foreground hover:text-foreground">{historico ? "Ocultar" : "Ver"} versões anteriores ({antigas.length})</button>
          {historico && <div className="mt-4 space-y-6">{antigas.map((x) => <div key={x.id}><div className="mb-2 text-[12px] text-muted-foreground">V{x.numero} · enviada {new Date(x.enviada_em).toLocaleDateString("pt-BR")} · Arte: {lbl(x.status_arte)} · Legenda: {lbl(x.status_legenda)}</div><VersionView v={x} /></div>)}</div>}
        </div>
      )}
    </article>
  );
}

const lbl = (s: string) => (s === "aprovado" ? "aprovada" : s === "alteracao_solicitada" ? "alteração pedida" : "pendente");

function Decision({ label, state, onDecide }: { label: string; state: string; onDecide: (d: "aprovado" | "alteracao_solicitada", t?: string) => Promise<boolean> }) {
  const [pedindo, setPedindo] = useState(false);
  const [t, setT] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (d: "aprovado" | "alteracao_solicitada") => { setBusy(true); const ok = await onDecide(d, t); setBusy(false); if (ok) { setPedindo(false); setT(""); } };
  return (
    <div className="rounded-md bg-muted/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={cn("text-[12px]", state === "aprovado" ? "text-success" : state === "alteracao_solicitada" ? "text-destructive" : "text-muted-foreground")}>{lbl(state)}</span>
        <div className="ml-auto flex gap-2">
          <button disabled={busy} onClick={() => setPedindo(!pedindo)} className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-3 text-[13px] text-foreground hover:bg-accent disabled:opacity-50"><RotateCcw size={13} /> Solicitar alteração</button>
          <button disabled={busy || state === "aprovado"} onClick={() => run("aprovado")} className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"><Check size={13} /> Aprovar</button>
        </div>
      </div>
      {pedindo && (
        <div className="mt-3 space-y-2">
          <textarea value={t} onChange={(e) => setT(e.target.value)} rows={3} placeholder={`O que precisa mudar na ${label.toLowerCase()}? (obrigatório)`} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
          <div className="flex justify-end"><button disabled={busy || !t.trim()} onClick={() => run("alteracao_solicitada")} className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-[13px] font-medium text-background disabled:opacity-50">Enviar pedido</button></div>
        </div>
      )}
    </div>
  );
}

function Conversa({ c }: { c: Item }) {
  const { data: uid } = useQuery({ queryKey: ["portal-uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null, staleTime: Infinity });
  if (!c.comentarios.length) return null;
  const ver = (id: string | null) => c.versoes.find((v) => v.id === id)?.numero;
  return (
    <div>
      <h4 className="mb-2 text-[13px] font-medium text-foreground">Comentários</h4>
      <ul className="space-y-2">
        {c.comentarios.map((m) => (
          <li key={m.id} className={cn("rounded-md px-3 py-2 text-sm", m.autor_id === uid ? "bg-muted/60" : "border border-border")}>
            <div className="mb-0.5 text-[11px] text-muted-foreground">
              {m.autor_id === uid ? "Você" : "Equipe Irys"}
              {m.alvo && m.alvo !== "geral" ? ` · ${m.alvo}` : ""}
              {ver(m.versao_id) ? ` · V${ver(m.versao_id)}` : ""} · {new Date(m.created_at).toLocaleDateString("pt-BR")}
            </div>
            <p className="whitespace-pre-wrap text-foreground">{m.texto}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VersionView({ v }: { v: Versao }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Media midias={v.midias} />
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{v.legenda || <span className="text-muted-foreground">Sem legenda.</span>}{v.hashtags && <div className="mt-3 text-muted-foreground">{v.hashtags}</div>}</div>
    </div>
  );
}

function Media({ midias }: { midias: VMidia[] }) {
  const sorted = [...(midias ?? [])].sort((a, b) => a.ordem - b.ordem);
  const { data: urls = [] } = useQuery({
    queryKey: ["portal-midia", sorted.map((m) => m.storage_path).join("|")],
    queryFn: () => Promise.all(sorted.map((m) => signedUrl(m.bucket, m.storage_path))),
    staleTime: 30 * 60_000,
  });
  const [i, setI] = useState(0);
  if (!sorted.length) return <div className="flex aspect-[4/5] items-center justify-center rounded-md border border-dashed border-border text-[13px] text-muted-foreground">Sem mídia</div>;
  const m = sorted[Math.min(i, sorted.length - 1)]; const url = urls[Math.min(i, sorted.length - 1)];
  return (
    <div>
      {url ? (m.tipo === "video" ? <video src={url} controls className="aspect-[4/5] w-full rounded-md bg-muted object-contain" /> : <img src={url} alt="" className="aspect-[4/5] w-full rounded-md bg-muted object-cover" />)
        : <div className="flex aspect-[4/5] items-center justify-center rounded-md bg-muted"><Film size={18} className="text-muted-foreground" /></div>}
      {sorted.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {sorted.map((_, k) => <button key={k} onClick={() => setI(k)} aria-label={`Imagem ${k + 1}`} className={cn("h-1.5 w-6 rounded-full", k === i ? "bg-foreground" : "bg-border")} />)}
        </div>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}
