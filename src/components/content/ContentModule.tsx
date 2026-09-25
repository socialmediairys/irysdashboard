import { ChevronLeft, ChevronRight, Film, Images, Lightbulb, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { btn, btnGhost, btnPrimary, inputCls } from "@/components/strategy/ui";
import {
  APPROVAL_STATUSES, CANAIS, CONTENT_STATUS, CONTENT_STATUS_LABEL, CONTENT_STATUS_VARIANT, FORMATOS, WORKFLOW,
  fmtShort, isLate, isoDay, parseLocal, useClientesLite, useContentActions, useConteudos, type Conteudo, type ContentStatus,
} from "@/lib/content";
import { cn } from "@/lib/utils";
import { ContentDetail } from "./ContentDetail";

export type ContentView = "calendario" | "producao" | "aprovacao" | "publicados" | "ideias";
const VIEWS: { key: ContentView; label: string }[] = [
  { key: "calendario", label: "Calendário" }, { key: "producao", label: "Produção" },
  { key: "aprovacao", label: "Em aprovação" }, { key: "publicados", label: "Publicados" }, { key: "ideias", label: "Ideias" },
];

/** Um único módulo: as views são recortes da mesma fonte `conteudos`. `clienteId` fixa o filtro (tab do cliente). */
export function ContentModule({ clienteId, initialView = "calendario" }: { clienteId?: string; initialView?: ContentView }) {
  const { data = [], isLoading, error } = useConteudos({ clienteId });
  const { data: clientes = [] } = useClientesLite();
  const nome = useMemo(() => new Map(clientes.map((c) => [c.id, c.nome])), [clientes]);
  const [view, setView] = useState<ContentView>(initialView);
  const [f, setF] = useState({ cliente: "", canal: "", formato: "", status: "", de: "", ate: "", q: "" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState<null | "conteudo" | "ideia">(null);

  const filtered = data.filter((c) =>
    (!f.cliente || c.cliente_id === f.cliente) && (!f.canal || c.canal === f.canal) && (!f.formato || c.formato === f.formato) &&
    (!f.status || c.status === f.status) && (!f.de || (c.data_prevista ?? "") >= f.de) && (!f.ate || (c.data_prevista ?? "9999") <= f.ate) &&
    (!f.q || `${c.titulo} ${c.legenda ?? ""}`.toLowerCase().includes(f.q.toLowerCase())));
  const cli = (id: string) => nome.get(id) ?? "";
  const sel = cn(inputCls, "h-8 w-auto py-1 text-[13px]");
  const common = { cli, open: setOpenId, showClient: !clienteId };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-md border border-border bg-card p-0.5">
          {VIEWS.map((v) => (
            <button key={v.key} onClick={() => setView(v.key)} className={cn("whitespace-nowrap rounded px-3 py-1.5 text-[13px] transition-colors", view === v.key ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>{v.label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className={btn} onClick={() => setCreating("ideia")}><Lightbulb size={14} strokeWidth={1.6} /> Ideia</button>
          <button className={btnPrimary} onClick={() => setCreating("conteudo")}><Plus size={14} /> Conteúdo</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Buscar" className={cn(sel, "w-44 pl-7")} />
        </div>
        {!clienteId && <select value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} className={sel} aria-label="Cliente"><option value="">Todos os clientes</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>}
        <select value={f.canal} onChange={(e) => setF({ ...f, canal: e.target.value })} className={sel} aria-label="Canal"><option value="">Canal</option>{CANAIS.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={f.formato} onChange={(e) => setF({ ...f, formato: e.target.value })} className={sel} aria-label="Formato"><option value="">Formato</option>{FORMATOS.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={sel} aria-label="Status"><option value="">Status</option>{CONTENT_STATUS.map((s) => <option key={s} value={s}>{CONTENT_STATUS_LABEL[s]}</option>)}</select>
        <input type="date" value={f.de} onChange={(e) => setF({ ...f, de: e.target.value })} className={sel} aria-label="De" />
        <input type="date" value={f.ate} onChange={(e) => setF({ ...f, ate: e.target.value })} className={sel} aria-label="Até" />
        {Object.values(f).some(Boolean) && <button className={btnGhost} onClick={() => setF({ cliente: "", canal: "", formato: "", status: "", de: "", ate: "", q: "" })}>Limpar</button>}
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Carregando…</div>}
      {error && <div className="text-sm text-destructive">Não foi possível carregar os conteúdos.</div>}
      {!isLoading && !error && (
        <>
          {view === "calendario" && <CalendarView items={filtered.filter((c) => c.status !== "ideia")} {...common} />}
          {view === "producao" && <ProductionView items={filtered.filter((c) => c.status !== "ideia")} {...common} />}
          {view === "aprovacao" && <ListView items={filtered.filter((c) => APPROVAL_STATUSES.includes(c.status))} empty="Nada aguardando o cliente." {...common} />}
          {view === "publicados" && <ListView items={filtered.filter((c) => c.status === "publicado").reverse()} empty="Nenhum conteúdo publicado ainda." {...common} />}
          {view === "ideias" && <IdeasView items={filtered.filter((c) => c.status === "ideia")} {...common} />}
        </>
      )}

      <ContentDetail id={openId} onClose={() => setOpenId(null)} />
      <NewContentDialog mode={creating} onClose={() => setCreating(null)} clienteId={clienteId} clientes={clientes} onCreated={(id) => { setCreating(null); if (id) setOpenId(id); }} />
    </div>
  );
}

type ViewProps = { items: Conteudo[]; cli: (id: string) => string; open: (id: string) => void; showClient: boolean };

function Thumb({ c }: { c: Conteudo }) {
  const n = c.midias?.length ?? 0;
  if (!n) return null;
  const Icon = c.midias!.some((m) => m.tipo === "video") ? Film : Images;
  return <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground"><Icon size={11} strokeWidth={1.6} />{n > 1 ? n : ""}</span>;
}

/* ---------- Calendário (Mês | Semana) ---------- */
function CalendarView({ items, cli, open, showClient }: ViewProps) {
  const [mode, setMode] = useState<"mes" | "semana">("mes");
  const [ref, setRef] = useState(() => new Date(new Date().setHours(0, 0, 0, 0)));
  const byDay = useMemo(() => {
    const m = new Map<string, Conteudo[]>();
    for (const c of items) if (c.data_prevista) { const k = c.data_prevista.slice(0, 10); m.set(k, [...(m.get(k) ?? []), c]); }
    return m;
  }, [items]);
  const semData = items.filter((c) => !c.data_prevista);

  const days: Date[] = [];
  if (mode === "mes") {
    const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    for (let i = 0; i < 42; i++) days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  } else {
    const start = new Date(ref); start.setDate(ref.getDate() - ((ref.getDay() + 6) % 7));
    for (let i = 0; i < 7; i++) days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  const shift = (d: number) => setRef(mode === "mes" ? new Date(ref.getFullYear(), ref.getMonth() + d, 1) : new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 7 * d));
  const today = isoDay(new Date());
  const title = mode === "mes"
    ? ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : `${days[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${days[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  const Chip = ({ c }: { c: Conteudo }) => (
    <button onClick={() => open(c.id)} className={cn("block w-full rounded border border-border bg-card px-1.5 py-1 text-left hover:border-foreground/30", isLate(c) && "border-l-2 border-l-destructive")}>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[c.status])} />
        <span className="truncate">{showClient ? cli(c.cliente_id) : c.canal ?? ""}</span>
      </div>
      <div className="truncate text-[12px] text-foreground">{c.titulo || "Sem título"}</div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><span className="truncate">{[showClient ? c.canal : null, c.formato].filter(Boolean).join(" · ")}</span><Thumb c={c} /></div>
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button className={btn} onClick={() => shift(-1)} aria-label="Anterior"><ChevronLeft size={14} /></button>
        <span className="min-w-40 text-center text-sm font-medium capitalize text-foreground">{title}</span>
        <button className={btn} onClick={() => shift(1)} aria-label="Próximo"><ChevronRight size={14} /></button>
        <button className={btnGhost} onClick={() => setRef(new Date(new Date().setHours(0, 0, 0, 0)))}>Hoje</button>
        <div className="ml-auto flex rounded-md border border-border bg-card p-0.5">
          {(["mes", "semana"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={cn("rounded px-3 py-1 text-[13px]", mode === m ? "bg-secondary font-medium text-foreground" : "text-muted-foreground")}>{m === "mes" ? "Mês" : "Semana"}</button>)}
        </div>
      </div>
      <div className="hidden flex-wrap gap-3 text-[11px] text-muted-foreground sm:flex">
        {WORKFLOW.map((s) => <span key={s} className="inline-flex items-center gap-1"><span className={cn("h-1.5 w-1.5 rounded-full", DOT[s])} />{CONTENT_STATUS_LABEL[s]}</span>)}
      </div>

      {/* Desktop grid */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <div className="grid grid-cols-7 border-b border-border text-[12px] text-muted-foreground">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <div key={d} className="px-2 py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const k = isoDay(d); const list = byDay.get(k) ?? [];
            const out = mode === "mes" && d.getMonth() !== ref.getMonth();
            const max = mode === "mes" ? 3 : 50;
            return (
              <div key={k} className={cn("space-y-1 border-b border-r border-border p-1.5 [&:nth-child(7n)]:border-r-0", mode === "mes" ? "min-h-[118px]" : "min-h-[420px]", out && "bg-muted/30")}>
                <div className={cn("px-0.5 text-[12px]", k === today ? "font-semibold text-primary" : out ? "text-text-tertiary" : "text-muted-foreground")}>{d.getDate()}</div>
                {list.slice(0, max).map((c) => <Chip key={c.id} c={c} />)}
                {list.length > max && <button onClick={() => { setMode("semana"); setRef(d); }} className="px-1 text-[11px] text-muted-foreground hover:text-foreground">+{list.length - max} mais</button>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: agenda por dia */}
      <div className="space-y-3 md:hidden">
        {days.filter((d) => (mode === "semana" || d.getMonth() === ref.getMonth()) && byDay.has(isoDay(d))).map((d) => (
          <div key={isoDay(d)}>
            <div className="mb-1 text-[12px] font-medium capitalize text-muted-foreground">{d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</div>
            <div className="space-y-1">{byDay.get(isoDay(d))!.map((c) => <Chip key={c.id} c={c} />)}</div>
          </div>
        ))}
        {!days.some((d) => (mode === "semana" || d.getMonth() === ref.getMonth()) && byDay.has(isoDay(d))) && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum conteúdo neste período.</p>}
      </div>

      {semData.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 text-[12px] text-muted-foreground">Sem data definida ({semData.length})</div>
          <div className="grid gap-1 sm:grid-cols-3 lg:grid-cols-5">{semData.map((c) => <Chip key={c.id} c={c} />)}</div>
        </div>
      )}
    </div>
  );
}

const DOT: Record<ContentStatus, string> = {
  ideia: "bg-muted-foreground/40", planejado: "bg-muted-foreground/50", em_producao: "bg-info", revisao_interna: "bg-primary",
  com_cliente: "bg-warning", alteracao_solicitada: "bg-destructive", aprovado: "bg-success", agendado: "bg-success", publicado: "bg-foreground/60",
};

/* ---------- Produção (Kanban no desktop, lista agrupada no mobile) ---------- */
function ProductionView({ items, cli, open, showClient }: ViewProps) {
  const a = useContentActions();
  const [drag, setDrag] = useState<string | null>(null);
  const [mobileStatus, setMobileStatus] = useState<ContentStatus>("em_producao");
  const Card = ({ c }: { c: Conteudo }) => (
    <div draggable onDragStart={() => setDrag(c.id)} onClick={() => open(c.id)}
      className={cn("cursor-pointer rounded-md border border-border bg-card p-2.5 hover:border-foreground/30", isLate(c) && "border-l-2 border-l-destructive")}>
      <div className="text-[13px] font-medium leading-snug text-foreground">{c.titulo || "Sem título"}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {showClient && <span className="truncate">{cli(c.cliente_id)}</span>}
        <span className="truncate">{[c.canal, c.formato].filter(Boolean).join(" · ")}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className={isLate(c) ? "text-destructive" : ""}>{fmtShort(c.data_prevista)}</span><Thumb c={c} />
      </div>
    </div>
  );
  return (
    <>
      <div className="hidden gap-3 overflow-x-auto pb-2 md:flex">
        {WORKFLOW.map((s) => {
          const list = items.filter((c) => c.status === s);
          return (
            <div key={s} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag) a.update(drag, { status: s }); setDrag(null); }}
              className="flex w-60 shrink-0 flex-col rounded-lg bg-muted/40 p-2">
              <div className="mb-2 flex items-center justify-between px-1 text-[12px] font-medium text-muted-foreground">
                <span>{CONTENT_STATUS_LABEL[s]}</span><span>{list.length}</span>
              </div>
              <div className="min-h-24 space-y-2">{list.map((c) => <Card key={c.id} c={c} />)}</div>
            </div>
          );
        })}
      </div>
      <div className="md:hidden">
        <select value={mobileStatus} onChange={(e) => setMobileStatus(e.target.value as ContentStatus)} className={cn(inputCls, "mb-3")} aria-label="Etapa">
          {WORKFLOW.map((s) => <option key={s} value={s}>{CONTENT_STATUS_LABEL[s]} ({items.filter((c) => c.status === s).length})</option>)}
        </select>
        <div className="space-y-2">
          {items.filter((c) => c.status === mobileStatus).map((c) => (
            <div key={c.id} className="space-y-1.5">
              <Card c={c} />
              <select value={c.status} onChange={(e) => a.update(c.id, { status: e.target.value as ContentStatus })} className={cn(inputCls, "h-8 py-1 text-[12px]")} aria-label="Mover para">
                {WORKFLOW.map((s) => <option key={s} value={s}>Mover para: {CONTENT_STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          ))}
          {!items.some((c) => c.status === mobileStatus) && <p className="py-6 text-center text-sm text-muted-foreground">Nada nesta etapa.</p>}
        </div>
      </div>
    </>
  );
}

/* ---------- Lista simples ---------- */
function ListView({ items, cli, open, showClient, empty }: ViewProps & { empty: string }) {
  if (!items.length) return <div className="rounded-lg border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">{empty}</div>;
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((c) => (
        <button key={c.id} onClick={() => open(c.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-accent/50">
          <span className="w-16 shrink-0 text-[13px] text-muted-foreground">{fmtShort(c.data_prevista)}</span>
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{c.titulo || "Sem título"}</span>
          {showClient && <span className="hidden truncate text-[13px] text-muted-foreground sm:inline">{cli(c.cliente_id)}</span>}
          <span className="hidden text-[13px] text-muted-foreground md:inline">{[c.canal, c.formato].filter(Boolean).join(" · ")}</span>
          <span className="text-[12px] text-muted-foreground">V{c.versao_atual}</span>
          <StatusBadge variant={CONTENT_STATUS_VARIANT[c.status]}>{CONTENT_STATUS_LABEL[c.status]}</StatusBadge>
        </button>
      ))}
    </div>
  );
}

/* ---------- Ideias (backlog) ---------- */
function IdeasView({ items, cli, open, showClient }: ViewProps) {
  const a = useContentActions();
  if (!items.length) return <div className="rounded-lg border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma ideia registrada. Use “Ideia” para anotar rapidamente.</div>;
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((c) => (
        <div key={c.id} className="flex items-center gap-3 px-5 py-3">
          <Lightbulb size={15} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
          <button onClick={() => open(c.id)} className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm text-foreground">{c.titulo || "Sem título"}</div>
            {showClient && <div className="text-[12px] text-muted-foreground">{cli(c.cliente_id)}</div>}
          </button>
          <button className={btn} onClick={() => a.update(c.id, { status: "planejado", origem: "ideia" })}>Transformar em conteúdo</button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Criação rápida ---------- */
function NewContentDialog({ mode, onClose, clienteId, clientes, onCreated }: {
  mode: null | "conteudo" | "ideia"; onClose: () => void; clienteId?: string; clientes: { id: string; nome: string }[]; onCreated: (id: string | null) => void;
}) {
  const a = useContentActions();
  const blank = { cliente_id: clienteId ?? "", titulo: "", data_prevista: "", canal: "Instagram", formato: "", obs: "" };
  const [f, setF] = useState(blank);
  const ideia = mode === "ideia";
  const submit = async () => {
    const id = await a.create({
      cliente_id: f.cliente_id, titulo: f.titulo, status: ideia ? "ideia" : "planejado", origem: ideia ? "ideia" : "avulso",
      data_prevista: f.data_prevista || null, canal: ideia ? null : f.canal || null, formato: f.formato || null,
      pipeline_mes: f.data_prevista ? `${f.data_prevista.slice(0, 7)}-01` : null,
    });
    if (id && f.obs.trim()) await (await import("@/lib/content")).cdb("conteudos_internos").insert({ conteudo_id: id, observacoes: f.obs.trim() });
    setF(blank); onCreated(ideia ? null : id);
  };
  return (
    <Dialog open={!!mode} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{ideia ? "Nova ideia" : "Novo conteúdo"}</DialogTitle>
          <DialogDescription>{ideia ? "Registre rápido; complete depois." : "Os demais campos ficam no detalhe."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5">
          {!clienteId && <select value={f.cliente_id} onChange={(e) => setF({ ...f, cliente_id: e.target.value })} className={inputCls} aria-label="Cliente"><option value="">Cliente</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>}
          <input autoFocus value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder={ideia ? "Qual é a ideia?" : "Título interno"} className={inputCls} />
          {ideia ? (
            <textarea value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} rows={3} placeholder="Observação (opcional)" className={inputCls} />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={f.data_prevista} onChange={(e) => setF({ ...f, data_prevista: e.target.value })} className={cn(inputCls, "col-span-2")} aria-label="Data prevista" />
              <select value={f.canal} onChange={(e) => setF({ ...f, canal: e.target.value })} className={inputCls} aria-label="Canal">{CANAIS.map((x) => <option key={x}>{x}</option>)}</select>
              <select value={f.formato} onChange={(e) => setF({ ...f, formato: e.target.value })} className={inputCls} aria-label="Formato"><option value="">Formato</option>{FORMATOS.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className={btn} onClick={onClose}>Cancelar</button>
          <button className={btnPrimary} disabled={!f.cliente_id || !f.titulo.trim()} onClick={submit}>{ideia ? "Salvar ideia" : "Criar"}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { parseLocal };
