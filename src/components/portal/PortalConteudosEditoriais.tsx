import { ReporteiMetrics, periodRange } from "@/components/metricas/ReporteiMetrics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Film, RotateCcw, Image as ImageIcon, Lightbulb, Clock3, CheckCircle2, ChevronRight, History, CalendarDays, Copy, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_VARIANT, cdb, fmtShort, signedUrl, type ContentStatus } from "@/lib/content";
import { cn } from "@/lib/utils";
import { competencia, monthLabel } from "@/lib/content";
import { MonthNav, useMonthState } from "@/components/content/MonthNav";

type VMidia = { bucket: string; storage_path: string; tipo: string; ordem: number; url?: string };
type Versao = { id: string; numero: number; legenda: string | null; hashtags: string | null; midias: VMidia[]; status: string; status_arte: string; status_legenda: string; enviada_em: string };
type Item = { id: string; titulo: string; canal: string | null; formato: string | null; data_prevista: string | null; status: ContentStatus; versao_atual: number; publicacao_url: string | null; publicado_em: string | null; pipeline_mes: string | null; created_at: string; versoes: Versao[]; comentarios: Coment[] };
type Coment = { id: string; texto: string; alvo: string; autor_id: string | null; created_at: string; versao_id: string | null };

/** Tudo aqui é lido direto do banco com as regras do cliente: só conteúdos enviados, versões enviadas e comentários do tipo "cliente". */
async function load(clienteId: string): Promise<Item[]> {
  const { data, error } = await cdb("conteudos")
    .select("id,titulo,canal,formato,data_prevista,pipeline_mes,created_at,status,versao_atual,publicacao_url,publicado_em,versoes:conteudo_versoes(id,numero,legenda,hashtags,midias,status,status_arte,status_legenda,enviada_em),comentarios:conteudo_comentarios(id,texto,alvo,autor_id,created_at,versao_id)")
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
  const [mes, setMes] = useMonthState(`portal:${clienteId}`);
  const all = data.filter(pending);
  const list = all.filter((c) => competencia(c) === mes);
  const outros = [...new Set(all.filter((c) => competencia(c) !== mes).map(competencia))].sort();
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  return (
    <div className="space-y-5">
      <MonthBar mes={mes} setMes={setMes} outros={outros} />
      {list.length ? <div className="grid gap-4 sm:grid-cols-2">{list.map((c) => <Link key={c.id} to="/meu-portal/conteudo/$conteudoId" params={{ conteudoId:c.id }} className="group overflow-hidden rounded-xl border border-border bg-card hover:shadow-md"><PortalThumbnail c={c}/><div className="space-y-2 p-4"><h3 className="text-sm font-semibold">{c.titulo || "Conteúdo"}</h3><p className="text-xs text-muted-foreground">{[c.formato,fmtShort(c.data_prevista)].filter(Boolean).join(" · ")}</p><span className="inline-flex items-center gap-1 text-xs font-medium">Abrir avaliação <ChevronRight size={14}/></span></div></Link>)}</div> : <Empty>Nenhum conteúdo aguardando sua aprovação em {monthLabel(mes)}.</Empty>}
   </div>
    )}
    </div>
  );
}

type GalleryFilter = "todos" | "ideia" | "final" | "aprovados";
function etapaCliente(c: Item): "ideia" | "final" | "aprovados" {
  if (["aprovado", "agendado", "publicado"].includes(c.status)) return "aprovados";
  // A versão de arte/legenda enviada determina a revisão final.
  // A aprovação prévia de ideias depende de um fluxo próprio no banco.
  return "final";
}
function clientStatus(c: Item) {
  if (c.status === "alteracao_solicitada") return "Alterações solicitadas";
  if (etapaCliente(c) === "aprovados") return "Aprovado";
  return "Aguardando sua avaliação";
}
function PortalThumbnail({ c }: { c: Item }) {
  const v = current(c);
  const first = [...(v?.midias ?? [])].sort((a,b)=>a.ordem-b.ordem)[0];
  const { data: url } = useQuery({
    queryKey: ["portal-thumb", first?.bucket, first?.storage_path],
    queryFn: () => signedUrl(first!.bucket, first!.storage_path),
    enabled: !!first,
    staleTime: 30 * 60_000,
  });
  return <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-stone-100">
    {url && first?.tipo === "video" ? <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
      : url ? <img src={url} alt="Prévia da publicação" loading="lazy" className="h-full w-full object-cover" />
      : <div className="flex flex-col items-center gap-2 text-stone-500"><Lightbulb size={26} strokeWidth={1.4}/><span className="text-xs">Prévia do conteúdo</span></div>}
    <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-medium text-stone-800 shadow-sm">{clientStatus(c)}</span>
  </div>;
}
export function PortalConteudos({ clienteId }: { clienteId: string }) {
  const { data: all = [], isLoading, error } = useClientContents(clienteId);
  const [mes, setMes] = useMonthState(`portal:${clienteId}`);
  const [filtro, setFiltro] = useState<GalleryFilter>("todos");
  const data = all.filter((c) => competencia(c) === mes);
  const filtrados = data.filter((c) => filtro === "todos" || etapaCliente(c) === filtro);
  const approved = data.filter((c) => etapaCliente(c) === "aprovados").length;
  const awaiting = data.filter((c) => pending(c)).length;
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando conteúdos…</p>;
  if (error) return <Empty>Não foi possível carregar os conteúdos. Tente novamente.</Empty>;
  const filters: { id: GalleryFilter; label: string; count: number }[] = [
    { id: "todos", label: "Todos", count: data.length },
    { id: "final", label: "Para avaliar", count: data.filter((c) => etapaCliente(c) === "final").length },
    { id: "aprovados", label: "Aprovados", count: approved },
  ];
  return <section className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-medium uppercase tracking-[.15em] text-muted-foreground">Portal do cliente</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Seus conteúdos</h2><p className="mt-1 text-sm text-muted-foreground">Acompanhe e aprove suas publicações.</p></div>
      <MonthBar mes={mes} setMes={setMes} />
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {[{ n: data.length, label: "Conteúdos do mês", icon: CalendarDays }, { n: awaiting, label: "Aguardando você", icon: Clock3 }, { n: approved, label: "Aprovados", icon: CheckCircle2 }].map(({n,label,icon:Icon}) => <div key={label} className="rounded-xl border border-border bg-card p-4"><Icon size={16} className="mb-3 text-muted-foreground"/><div className="text-2xl font-semibold tabular-nums">{n}</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></div>)}
    </div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar conteúdos">
      {filters.map((f) => <button key={f.id} type="button" onClick={() => setFiltro(f.id)} aria-pressed={filtro === f.id} className={cn("rounded-full border px-3 py-2 text-xs font-medium transition-colors", filtro === f.id ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground")}>{f.label} ({f.count})</button>)}
    </div>
    {!filtrados.length ? <Empty>{data.length ? "Nenhum conteúdo neste filtro." : `Nenhum conteúdo disponível em ${monthLabel(mes)}.`}</Empty> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtrados.map((c) => <Link key={c.id} to="/meu-portal/conteudo/$conteudoId" params={{ conteudoId: c.id }} className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <PortalThumbnail c={c}/>
        <div className="space-y-2 p-4"><h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">{c.titulo || "Conteúdo"}</h3><p className="text-xs text-muted-foreground">{[c.formato || c.canal, fmtShort(c.data_prevista)].filter(Boolean).join(" · ") || monthLabel(competencia(c))}</p>
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs font-medium"><span>{pending(c) ? "Avaliar conteúdo" : "Ver conteúdo"}</span><ChevronRight size={15} className="transition-transform group-hover:translate-x-1"/></div></div>
      </Link>)}
    </div>}
  </section>;
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

function ApprovalCard({ c, clienteId, detailLink }: { c: Item; clienteId: string; detailLink?: boolean }) {
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
          <p className="text-[13px] text-muted-foreground">{[c.canal, c.formato, fmtShort(c.data_prevista), `Competência ${monthLabel(competencia(c))}`].filter(Boolean).join(" · ")} · Versão {v.numero}</p>
        </div>
        <StatusBadge variant={CONTENT_STATUS_VARIANT[c.status]}>{CONTENT_STATUS_LABEL[c.status]}</StatusBadge>
        {detailLink && <Link to="/meu-portal/conteudo/$conteudoId" params={{ conteudoId: c.id }} className="text-[13px] text-muted-foreground hover:text-foreground">Abrir</Link>}
      </header>
      <div className="grid gap-6 p-5 md:grid-cols-2">
        <div className="space-y-3">
          <Media midias={v.midias} />
          {pending(c) && <Decision label="Arte" state={v.status_arte} onDecide={(d, t) => avaliar("arte", d, t)} />}
        </div>
        <div className="space-y-3">
          <div className="whitespace-pre-wrap rounded-md border border-border p-4 text-sm leading-relaxed text-foreground">{v.legenda || <span className="text-muted-foreground">Sem legenda.</span>}{v.hashtags && <div className="mt-3 text-muted-foreground">{v.hashtags}</div>}</div>
          {pending(c) && <Decision label="Legenda" state={v.status_legenda} onDecide={(d, t) => avaliar("legenda", d, t)} />}
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

function MonthBar({ mes, setMes, outros = [] }: { mes: string; setMes: (v: string) => void; outros?: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MonthNav value={mes} onChange={setMes} />
      {outros.length > 0 && <span className="text-[12px] text-muted-foreground">Também aguardando você: {outros.map((m) => <button key={m} onClick={() => setMes(m)} className="ml-1 underline-offset-2 hover:text-foreground hover:underline">{monthLabel(m)}</button>)}</span>}
    </div>
  );
}

/** Detalhe do conteúdo dentro do Portal (nunca abre o editor interno). RLS limita aos conteúdos enviados ao próprio cliente. */
export function PortalConteudoDetalhe({ clienteId, conteudoId }: { clienteId: string; conteudoId: string }) {
  const { data = [], isLoading, error } = useClientContents(clienteId);
  const c = data.find((x) => x.id === conteudoId);
  const voltar = <Link to="/meu-portal" search={{ tab: "conteudos" }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Voltar aos conteúdos</Link>;
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (error) return <div className="space-y-4">{voltar}<Empty>Não foi possível carregar. Tente novamente.</Empty></div>;
  if (!c || !current(c)) return <div className="space-y-4">{voltar}<Empty>Conteúdo não encontrado ou não disponível para você.</Empty></div>;
  const v = current(c)!;
  return <div className="space-y-6">
    {voltar}
    <div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><span className="text-xs uppercase tracking-widest text-muted-foreground">{monthLabel(competencia(c))}</span><span className="rounded-full border border-border px-2.5 py-1 text-[11px]">{clientStatus(c)}</span></div><h1 className="text-2xl font-semibold tracking-tight">{c.titulo || "Avaliação do conteúdo"}</h1><p className="text-sm text-muted-foreground">{[c.formato, c.canal, fmtShort(c.data_prevista)].filter(Boolean).join(" · ")} · Versão {v.numero}</p></div>
    <SimpleApproval c={c} clienteId={clienteId}/>
    <PortalHistory c={c}/>
  </div>;
}

function SimpleApproval({ c, clienteId }: { c: Item; clienteId: string }) {
  const v = current(c)!;
  const qc = useQueryClient();
  const [choices, setChoices] = useState<Record<string, "aprovado" | "alteracao_solicitada" | "">>({arte:"",legenda:""});
  const [notes, setNotes] = useState<Record<string,string>>({arte:"",legenda:""});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const send = async () => {
    const decisions = (["arte", "legenda"] as const).filter((part) => v[`status_${part}`] !== "aprovado" && choices[part]);
    if (!decisions.length) return;
    if (decisions.some((part) => choices[part] === "alteracao_solicitada" && !notes[part].trim())) { toast.error("Descreva o que gostaria de alterar."); return; }
    setBusy(true);
    try {
      for (const part of decisions) {
        const note = notes[part]?.trim() || (part === "legenda" ? message.trim() : "");
        const { error } = await supabase.rpc("cliente_avaliar_conteudo" as never, { _versao_id:v.id, _parte:part, _decisao:choices[part], _comentario:note || null } as never);
        if (error) throw error;
      }
      toast.success("Avaliação registrada com sucesso.");
      setChoices({arte:"",legenda:""}); setNotes({arte:"",legenda:""}); setMessage("");
      await qc.invalidateQueries({queryKey:["portal-conteudos",clienteId]});
    } catch { toast.error("Não foi possível concluir a avaliação. Confira o status antes de tentar novamente."); await qc.invalidateQueries({queryKey:["portal-conteudos",clienteId]}); }
    finally { setBusy(false); }
  };
  const canReview = pending(c);
  const part = (key: "arte" | "legenda", label: string) => <div className="space-y-3 rounded-xl border border-border p-4">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{label}</h3><span className="text-xs text-muted-foreground">{lbl(v[`status_${key}`])}</span></div>
    {canReview && v[`status_${key}`] !== "aprovado" ? <div className="space-y-2">
      {([ ["aprovado", `Aprovar ${key === "arte" ? "arte" : "legenda"}`], ["alteracao_solicitada", "Quero solicitar alterações"] ] as const).map(([value,text])=><label key={value} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm", choices[key] === value ? "border-foreground bg-muted/60" : "border-border hover:bg-muted/30")}><input type="radio" name={`portal-${c.id}-${key}`} checked={choices[key] === value} onChange={()=>setChoices((old)=>({...old,[key]:value}))}/>{text}</label>)}
      {choices[key] === "alteracao_solicitada" && <textarea rows={3} value={notes[key]} onChange={(e)=>setNotes((old)=>({...old,[key]:e.target.value}))} placeholder={`O que você gostaria de mudar na ${key}?`} className="w-full rounded-lg border border-input bg-background p-3 text-sm"/>}
    </div> : <p className="text-sm text-muted-foreground">{v[`status_${key}`] === "aprovado" ? "Esta parte já foi aprovada." : "Nenhuma avaliação pendente no momento."}</p>}
  </div>;
  return <div className="space-y-5">
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-3"><div className="rounded-xl border border-border bg-card p-3"><Media midias={v.midias}/></div>{part("arte","1. Avaliar arte")}</section>
      <section className="space-y-3"><div className="rounded-xl border border-border bg-card p-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Legenda para Instagram</h2><span className="text-xs text-muted-foreground">Versão {v.numero}</span></div><div className="whitespace-pre-wrap text-sm leading-7">{v.legenda || <span className="text-muted-foreground">Legenda ainda não disponível.</span>}{v.hashtags && <p className="mt-4 text-muted-foreground">{v.hashtags}</p>}</div><button type="button" onClick={()=>{void navigator.clipboard.writeText([v.legenda,v.hashtags].filter(Boolean).join("\n\n")); toast.success("Legenda copiada.");}} className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"><Copy size={13}/> Copiar legenda</button></div>{part("legenda","2. Avaliar legenda")}</section>
    </div>
    {canReview && <div className="rounded-xl border border-border bg-card p-4 sm:p-5"><label htmlFor="portal-observacoes" className="text-sm font-semibold">Observações adicionais <span className="font-normal text-muted-foreground">(opcional)</span></label><textarea id="portal-observacoes" value={message} onChange={(e)=>setMessage(e.target.value)} rows={2} placeholder="Quer acrescentar alguma informação sobre a legenda?" className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm"/><p className="mt-1 text-xs text-muted-foreground">As observações serão enviadas com a avaliação da legenda.</p><button disabled={busy || !(["arte","legenda"] as const).some((key)=>v[`status_${key}`]!=="aprovado" && !!choices[key])} onClick={send} className="mt-4 w-full rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background disabled:opacity-50">{busy ? "Enviando…" : "Enviar avaliação"}</button></div>}
  </div>;
}

function PortalHistory({c}:{c:Item}) {
  const [open,setOpen]=useState(false);
  const versions=[...c.versoes].sort((a,b)=>b.numero-a.numero);
  return <section className="rounded-xl border border-border bg-card">
    <button type="button" onClick={()=>setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"><span className="flex items-center gap-2 text-sm font-semibold"><History size={17}/> Histórico e versões <span className="text-xs font-normal text-muted-foreground">({versions.length})</span></span><ChevronRight size={16} className={cn("transition-transform",open&&"rotate-90")}/></button>
    {open&&<div className="space-y-5 border-t border-border p-4 sm:p-5"><div className="space-y-3">{versions.map((v)=><div key={v.id} className="rounded-lg border border-border p-3"><div className="flex flex-wrap justify-between gap-2"><span className="text-sm font-medium">Versão {v.numero}</span><span className="text-xs text-muted-foreground">{v.enviada_em ? new Date(v.enviada_em).toLocaleString("pt-BR") : ""}</span></div><div className="mt-1 text-xs text-muted-foreground">Arte: {lbl(v.status_arte)} · Legenda: {lbl(v.status_legenda)}</div>{v.numero!==current(c)?.numero&&<div className="mt-3"><VersionView v={v}/></div>}</div>)}</div>{c.comentarios.length>0&&<div className="border-t border-border pt-4"><Conversa c={c}/></div>}</div>}
  </section>;
}
