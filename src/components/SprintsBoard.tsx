import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, MessageCircle, Clock, Search, MoreHorizontal, Archive } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  DndContext, PointerSensor, TouchSensor, useSensor, useSensors, closestCorners, useDroppable, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/status-badge";
import { useClientes } from "@/components/crud/forms";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_STATUS, normalizeStatus, normalizePriority, priorityLabel, statusLabel, fmtDuration, useTeamMembers, type TaskStatus } from "@/lib/tasks";

type SprintRow = { id: string; name: string; status: "current" | "next" | "future"; start_date: string | null; end_date: string | null; archived_at: string | null };

const SPRINT_KEY = "irys.sprints.selected";
const NO_ACTIVE = "__no_active__";
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const inPeriod = (s: SprintRow, t: string) => !!s.start_date && s.start_date <= t && (!s.end_date || s.end_date >= t);

/** Escolha automática: só sprints ativas (não arquivadas), pelo período — nunca por created_at. */
function chooseSprint(all: SprintRow[], saved: string | null): string | null {
  const act = all.filter((s) => !s.archived_at);
  if (!act.length) return null;
  const t = todayISO();
  const byStartDesc = (a: SprintRow, b: SprintRow) => (b.start_date ?? "").localeCompare(a.start_date ?? "");
  const current = act.filter((s) => inPeriod(s, t)).sort(byStartDesc);
  const sv = saved ? act.find((s) => s.id === saved) : undefined;
  // Seleção salva só vale se ainda ativa e não houver sprint do período atual (ou se ela própria for do período).
  if (sv && (!current.length || inPeriod(sv, t))) return sv.id;
  if (current.length) return current[0].id;
  const future = act.filter((s) => s.start_date && s.start_date > t).sort((a, b) => a.start_date!.localeCompare(b.start_date!));
  if (future.length) return future[0].id;
  return [...act].sort((a, b) => (b.end_date ?? b.start_date ?? "").localeCompare(a.end_date ?? a.start_date ?? ""))[0].id;
}
type TaskRow = {
  id: string; titulo: string; status: string; prioridade: string; sprint_id: string | null;
  cliente_id: string | null; assignee_id: string | null; prazo: string | null; created_at: string;
  tempo_total_segundos: number | null; timer_status: string | null;
};
type View = "quadro" | "cliente" | "responsavel" | "todas";
const VIEWS: { key: View; label: string }[] = [
  { key: "quadro", label: "Quadro" },
  { key: "cliente", label: "Cliente" },
  { key: "responsavel", label: "Responsável" },
  { key: "todas", label: "Todas as tarefas" },
];
const ALL = "__all";
const NONE = "__none";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (t: string) => supabase.from(t as any) as any;

const fmtDate = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : null);
const isLate = (t: TaskRow) => !!t.prazo && normalizeStatus(t.status) !== "done" && t.prazo < new Date().toISOString().slice(0, 10);

type Ctx = { clientName: (id: string | null) => string | null; memberName: (id: string | null) => string | null; comments: Record<string, number> };

function Initials({ name }: { name: string }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-muted-foreground" title={name}>
      {name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
    </span>
  );
}

function TaskCard({ t, ctx, onOpen, handle }: { t: TaskRow; ctx: Ctx; onOpen: () => void; handle?: React.HTMLAttributes<HTMLButtonElement> }) {
  const client = ctx.clientName(t.cliente_id);
  const who = ctx.memberName(t.assignee_id);
  const prio = normalizePriority(t.prioridade);
  return (
    <div className="rounded-md border border-border bg-card p-2.5 transition-colors hover:border-foreground/30">
      <div className="flex items-start gap-2">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="text-[13px] font-medium leading-snug text-foreground">{t.titulo}</div>
          {client && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{client}</div>}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            {who && <span className="inline-flex items-center gap-1"><Initials name={who} /><span className="max-w-[90px] truncate">{who.split(" ")[0]}</span></span>}
            {t.prazo && <span className={isLate(t) ? "text-destructive" : ""}>{fmtDate(t.prazo)}</span>}
            {prio !== "medium" && <StatusBadge variant={prio === "high" ? "danger" : "neutral"}>{priorityLabel(prio)}</StatusBadge>}
            {(t.tempo_total_segundos ?? 0) > 0 || t.timer_status === "running" ? (
              <span className="inline-flex items-center gap-0.5"><Clock size={11} className={t.timer_status === "running" ? "text-primary" : ""} />{fmtDuration(t.tempo_total_segundos)}</span>
            ) : null}
            {ctx.comments[t.id] > 0 && <span className="inline-flex items-center gap-0.5"><MessageCircle size={11} />{ctx.comments[t.id]}</span>}
          </div>
        </button>
        {handle && (
          <button type="button" aria-label="Arrastar" className="shrink-0 cursor-grab rounded p-1 text-xs text-muted-foreground active:cursor-grabbing" {...handle}>⋮⋮</button>
        )}
      </div>
    </div>
  );
}

function SortableTask({ t, ctx, onOpen }: { t: TaskRow; ctx: Ctx; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id, data: { status: normalizeStatus(t.status) } });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }} {...attributes}>
      <TaskCard t={t} ctx={ctx} onOpen={onOpen} handle={listeners as unknown as React.HTMLAttributes<HTMLButtonElement>} />
    </div>
  );
}

function QuickAdd({ onCreate }: { onCreate: (titulo: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState("");
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 w-full rounded-md py-1.5 text-left text-xs text-muted-foreground hover:bg-card hover:text-foreground">
        <Plus size={12} className="mx-1 inline" /> Nova tarefa
      </button>
    );
  }
  const submit = async () => {
    if (!v.trim()) { setOpen(false); return; }
    if (await onCreate(v.trim())) setV("");
  };
  return (
    <input
      autoFocus value={v} onChange={(e) => setV(e.target.value)} aria-label="Título da nova tarefa"
      onKeyDown={(e) => { if (e.key === "Enter") void submit(); if (e.key === "Escape") { setOpen(false); setV(""); } }}
      onBlur={() => { if (!v.trim()) setOpen(false); }}
      placeholder="Título e Enter…"
      className="mt-2 h-9 w-full rounded-md border border-border bg-card px-2 text-[13px] outline-none focus:border-foreground/40"
    />
  );
}

function Column({ colKey, label, count, children, onCreate }: { colKey: string; label: string; count: number; children: React.ReactNode; onCreate: (t: string) => Promise<boolean> }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${colKey}`, data: { status: colKey } });
  return (
    <div ref={setNodeRef} className={`flex min-h-[320px] flex-col rounded-lg p-2 transition-colors ${isOver ? "bg-accent" : "bg-muted/40"}`}>
      <div className="mb-2 flex items-center justify-between px-1 text-[12px] text-muted-foreground">
        <span className="font-medium">{label}</span><span>{count}</span>
      </div>
      <div className="flex-1 space-y-2">{children}</div>
      <QuickAdd onCreate={onCreate} />
    </div>
  );
}

function ListRow({ t, ctx, onOpen, hide }: { t: TaskRow; ctx: Ctx; onOpen: () => void; hide?: "cliente" | "responsavel" }) {
  const who = ctx.memberName(t.assignee_id);
  const client = ctx.clientName(t.cliente_id);
  return (
    <button type="button" onClick={onOpen} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-3 py-2 text-left text-[13px] hover:bg-muted/50 md:grid-cols-[minmax(0,1fr)_120px_150px_150px_70px_70px]">
      <span className="truncate font-medium text-foreground">{t.titulo}</span>
      <span className="text-muted-foreground md:order-none">{statusLabel(t.status)}</span>
      <span className="hidden truncate text-muted-foreground md:block">{hide === "cliente" ? "" : client ?? "—"}</span>
      <span className="hidden truncate text-muted-foreground md:block">{hide === "responsavel" ? "" : who ?? "—"}</span>
      <span className={`hidden md:block ${isLate(t) ? "text-destructive" : "text-muted-foreground"}`}>{fmtDate(t.prazo) ?? "—"}</span>
      <span className="hidden text-muted-foreground md:block">{priorityLabel(t.prioridade)}</span>
      <span className="col-span-2 truncate text-[12px] text-muted-foreground md:hidden">
        {[hide !== "cliente" && client, hide !== "responsavel" && who, fmtDate(t.prazo)].filter(Boolean).join(" · ")}
      </span>
    </button>
  );
}

function Grouped({ groups, ctx, onOpen, hide }: { groups: { key: string; label: string; items: TaskRow[] }[]; ctx: Ctx; onOpen: (id: string) => void; hide: "cliente" | "responsavel" }) {
  if (!groups.length) return <div className="py-10 text-center text-sm text-muted-foreground">Nenhuma tarefa neste filtro.</div>;
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="mb-1 flex items-center gap-2 px-1 text-[13px] font-semibold text-foreground">{g.label}<span className="font-normal text-muted-foreground">{g.items.length}</span></h3>
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {g.items.map((t) => <ListRow key={t.id} t={t} ctx={ctx} onOpen={() => onOpen(t.id)} hide={hide} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function NewSprintDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"current" | "next" | "future">("next");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome da sprint");
      return;
    }
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("sprints" as any) as any)
      .insert({
        name: name.trim(),
        status,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sprint criada");
    onCreated(data.id);
    onOpenChange(false);
    setName("");
    setStartDate("");
    setEndDate("");
    setStatus("next");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova sprint</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint 12" />
          </div>
          <div>
            <label className="text-xs font-semibold">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Atual</SelectItem>
                <SelectItem value="next">Próxima</SelectItem>
                <SelectItem value="future">Futura</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold">Início</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold">Fim</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando..." : "Criar sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


/* ---------------- Main page ---------------- */

export function SprintsBoard({ initialTaskId }: { initialTaskId?: string } = {}) {
  const [sprints, setSprints] = useState<SprintRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [comments, setComments] = useState<Record<string, number>>({});
  const [sprintFilter, setSprintFilter] = useState<string | null>(null);
  const [view, setView] = useState<View>("quadro");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSprintOpen, setNewSprintOpen] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(initialTaskId ?? null);
  const [mobileCol, setMobileCol] = useState<TaskStatus>("not_started");
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<string>(ALL);

  const clientes = useClientes();
  const members = useTeamMembers();
  const [extraNames, setExtraNames] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
  );

  const fetchSprints = useCallback(async () => {
    const { data, error: err } = await db("sprints").select("id,name,status,start_date,end_date,archived_at").order("start_date", { ascending: true, nullsFirst: false });
    if (err) { setError("Não foi possível carregar as sprints."); return [] as SprintRow[]; }
    setSprints((data ?? []) as SprintRow[]);
    return (data ?? []) as SprintRow[];
  }, []);

  /** Uma única base de tarefas; todas as views são filtros dela. Ordem: criação ASC. */
  const fetchTasks = useCallback(async () => {
    const { data, error: err } = await db("tarefas")
      .select("id,titulo,status,prioridade,sprint_id,cliente_id,assignee_id,prazo,created_at,tempo_total_segundos,timer_status")
      .order("created_at", { ascending: true });
    setLoading(false);
    if (err) { setError("Não foi possível carregar as tarefas."); return; }
    setError(null);
    const rows = (data ?? []) as TaskRow[];
    setTasks(rows);
    const ids = rows.map((r) => r.id);
    if (ids.length) {
      const { data: cc } = await db("task_comments").select("task_id").in("task_id", ids);
      const m: Record<string, number> = {};
      (cc ?? []).forEach((r: { task_id: string }) => { m[r.task_id] = (m[r.task_id] ?? 0) + 1; });
      setComments(m);
    }
  }, []);

  const selectSprint = useCallback((id: string | null) => {
    setSprintFilter(id);
    if (id && id !== ALL && id !== NONE) localStorage.setItem(SPRINT_KEY, id); else localStorage.removeItem(SPRINT_KEY);
  }, []);
  const autoSelect = useCallback((s: SprintRow[]) => {
    const saved = localStorage.getItem(SPRINT_KEY);
    setSprintFilter(chooseSprint(s, saved) ?? NO_ACTIVE);
  }, []);

  useEffect(() => {
    (async () => {
      const s = await fetchSprints();
      autoSelect(s);
      await fetchTasks();
    })();
  }, [fetchSprints, fetchTasks, autoSelect]);

  const [confirmArchive, setConfirmArchive] = useState<SprintRow | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const activeSprints = sprints.filter((s) => !s.archived_at);
  const archivedSprints = sprints.filter((s) => s.archived_at);
  const selected = sprints.find((s) => s.id === sprintFilter) ?? null;
  const setArchived = async (sp: SprintRow, archived: boolean) => {
    const { error: err } = await db("sprints").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", sp.id);
    if (err) { toast.error("Não foi possível atualizar a sprint."); return; }
    toast.success(archived ? "Sprint arquivada" : "Sprint restaurada");
    const s = await fetchSprints();
    if (archived && sprintFilter === sp.id) { localStorage.removeItem(SPRINT_KEY); autoSelect(s); }
  };

  // nomes de responsáveis que não estão mais na equipe (preserva exibição)
  useEffect(() => {
    const missing = Array.from(new Set(tasks.map((t) => t.assignee_id).filter((id): id is string => !!id && !members.some((m) => m.id === id) && !extraNames[id])));
    if (!missing.length) return;
    db("profiles").select("id,nome").in("id", missing).then(({ data }: { data: { id: string; nome: string | null }[] | null }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((p) => { m[p.id] = p.nome ?? "Sem nome"; });
      setExtraNames((prev) => ({ ...prev, ...m }));
    });
  }, [tasks, members]); // eslint-disable-line react-hooks/exhaustive-deps

  const ctx: Ctx = useMemo(() => {
    const cn: Record<string, string> = {}; clientes.forEach((c) => (cn[c.id] = c.nome));
    const mn: Record<string, string> = { ...extraNames }; members.forEach((m) => (mn[m.id] = m.nome));
    return { clientName: (id) => (id ? cn[id] ?? null : null), memberName: (id) => (id ? mn[id] ?? null : null), comments };
  }, [clientes, members, extraNames, comments]);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (sprintFilter && sprintFilter !== ALL) {
      if (sprintFilter === NONE ? t.sprint_id !== null : t.sprint_id !== sprintFilter) return false;
    }
    return true;
  }), [tasks, sprintFilter]);

  const createTask = async (titulo: string, status: TaskStatus) => {
    const { error: err } = await db("tarefas").insert({
      titulo, status, tipo: "outro", prioridade: "medium", timer_status: "stopped",
      sprint_id: sprintFilter && sprintFilter !== ALL && sprintFilter !== NONE ? sprintFilter : null,
    });
    if (err) { toast.error("Não foi possível criar a tarefa."); return false; }
    await fetchTasks();
    return true;
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const id = String(active.id);
    const from = (active.data.current as { status?: string } | undefined)?.status;
    let to = (over.data.current as { status?: string } | undefined)?.status;
    if (!to && String(over.id).startsWith("col:")) to = String(over.id).slice(4);
    if (!to || to === from || !TASK_STATUS.some((c) => c.key === to)) return;
    // Só o status muda; created_at (e a ordem) ficam intactos.
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: to! } : t)));
    const { error: err } = await db("tarefas").update({ status: to }).eq("id", id);
    if (err) { toast.error("Não foi possível mover a tarefa."); void fetchTasks(); }
  };

  const byStatus = (k: string) => filtered.filter((t) => normalizeStatus(t.status) === k);

  const groupBy = (keyOf: (t: TaskRow) => string | null, labelOf: (k: string) => string, emptyLabel: string) => {
    const map = new Map<string, TaskRow[]>();
    filtered.forEach((t) => { const k = keyOf(t) ?? NONE; (map.get(k) ?? map.set(k, []).get(k)!).push(t); });
    return Array.from(map.entries())
      .map(([key, items]) => ({ key, label: key === NONE ? emptyLabel : labelOf(key), items }))
      .sort((a, b) => (a.key === NONE ? 1 : b.key === NONE ? -1 : a.label.localeCompare(b.label, "pt-BR")));
  };

  const allRows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return filtered.filter((t) => {
      if (statusF !== ALL && normalizeStatus(t.status) !== statusF) return false;
      if (!s) return true;
      return [t.titulo, ctx.clientName(t.cliente_id), ctx.memberName(t.assignee_id)].some((x) => x?.toLowerCase().includes(s));
    });
  }, [filtered, q, statusF, ctx]);

  const open = (id: string) => setOpenTaskId(id);

  return (
    <>
      <PageHeader
        title="Tarefas & Sprints"
        description="O trabalho necessário para executar os conteúdos e demais entregas."
        actions={<Button onClick={() => setNewSprintOpen(true)} size="sm"><Plus size={14} className="mr-1" /> Nova sprint</Button>}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border bg-card p-0.5" role="tablist" aria-label="Visualização">
          {VIEWS.map((v) => (
            <button key={v.key} role="tab" aria-selected={view === v.key} type="button" onClick={() => setView(v.key)}
              className={`rounded px-3 py-1 text-[13px] ${view === v.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
              {v.label}
            </button>
          ))}
        </div>
        <Select value={sprintFilter === NO_ACTIVE ? undefined : sprintFilter ?? ALL} onValueChange={selectSprint}>
          <SelectTrigger className="h-8 w-auto min-w-[180px] text-[13px]" aria-label="Sprint"><SelectValue placeholder="Nenhuma sprint ativa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as sprints</SelectItem>
            <SelectItem value={NONE}>Sem sprint</SelectItem>
            {activeSprints.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}{s.start_date && inPeriod(s, todayISO()) ? " · atual" : ""}</SelectItem>)}
            {selected?.archived_at && <SelectItem value={selected.id}>{selected.name} · arquivada</SelectItem>}
          </SelectContent>
        </Select>
        {selected && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Ações da sprint"><MoreHorizontal size={14} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {selected.archived_at
                ? <DropdownMenuItem onClick={() => setArchived(selected, false)}>Restaurar sprint</DropdownMenuItem>
                : <DropdownMenuItem onClick={() => setConfirmArchive(selected)}>Arquivar sprint</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button variant="ghost" size="sm" className="h-8 text-[13px] text-muted-foreground" onClick={() => setArchivedOpen(true)}>
          <Archive size={14} className="mr-1" /> Arquivadas ({archivedSprints.length})
        </Button>
      </div>

      {sprintFilter === NO_ACTIVE ? (
        <div className="rounded-lg border border-dashed border-border px-5 py-12 text-center">
          <div className="text-sm font-medium text-foreground">Nenhuma Sprint ativa</div>
          <Button size="sm" className="mt-3" onClick={() => setNewSprintOpen(true)}><Plus size={14} className="mr-1" /> Criar Sprint</Button>
        </div>
      ) : loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Carregando tarefas…</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-destructive">
          {error} <button type="button" onClick={() => fetchTasks()} className="ml-2 font-semibold underline">Tentar novamente</button>
        </div>
      ) : view === "quadro" ? (
        <>
          <div className="mb-2 flex gap-1 overflow-x-auto md:hidden" role="tablist" aria-label="Status">
            {TASK_STATUS.map((c) => (
              <button key={c.key} type="button" role="tab" aria-selected={mobileCol === c.key} onClick={() => setMobileCol(c.key)}
                className={`shrink-0 rounded-md border px-3 py-1.5 text-[13px] ${mobileCol === c.key ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground"}`}>
                {c.label} <span className="opacity-70">{byStatus(c.key).length}</span>
              </button>
            ))}
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {TASK_STATUS.map((col) => {
                const items = byStatus(col.key);
                return (
                  <div key={col.key} className={mobileCol === col.key ? "" : "hidden md:block"}>
                    <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                      <Column colKey={col.key} label={col.label} count={items.length} onCreate={(t) => createTask(t, col.key)}>
                        {items.map((t) => <SortableTask key={t.id} t={t} ctx={ctx} onOpen={() => open(t.id)} />)}
                      </Column>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </DndContext>
        </>
      ) : view === "cliente" ? (
        <Grouped groups={groupBy((t) => t.cliente_id, (k) => ctx.clientName(k) ?? "Cliente", "Sem cliente")} ctx={ctx} onOpen={open} hide="cliente" />
      ) : view === "responsavel" ? (
        <Grouped groups={groupBy((t) => t.assignee_id, (k) => ctx.memberName(k) ?? "Membro", "Sem responsável")} ctx={ctx} onOpen={open} hide="responsavel" />
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título, cliente ou responsável" className="h-9 pl-8 text-[13px]" aria-label="Buscar tarefas" />
            </div>
            <Select value={statusF} onValueChange={setStatusF}>
              <SelectTrigger className="h-9 w-[160px] text-[13px]" aria-label="Filtrar status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os status</SelectItem>
                {TASK_STATUS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <div className="hidden grid-cols-[minmax(0,1fr)_120px_150px_150px_70px_70px] gap-x-3 border-b border-border px-3 py-2 text-[12px] text-muted-foreground md:grid">
              <span>Tarefa</span><span>Status</span><span>Cliente</span><span>Responsável</span><span>Prazo</span><span>Prioridade</span>
            </div>
            {allRows.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">Nenhuma tarefa encontrada.</div>
              : <div className="divide-y divide-border">{allRows.map((t) => <ListRow key={t.id} t={t} ctx={ctx} onOpen={() => open(t.id)} />)}</div>}
          </div>
          <div className="flex justify-end">
            <QuickAddButton onCreate={(t) => createTask(t, "not_started")} />
          </div>
        </div>
      )}

      <NewSprintDialog open={newSprintOpen} onOpenChange={setNewSprintOpen} onCreated={async (id) => { await fetchSprints(); selectSprint(id); }} />
      <AlertDialog open={!!confirmArchive} onOpenChange={(o) => !o && setConfirmArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar “{confirmArchive?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>A sprint sai da operação corrente. Nada é excluído: tarefas, comentários, anexos, tempo e vínculos continuam preservados e ela pode ser restaurada em Arquivadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (confirmArchive) await setArchived(confirmArchive, true); setConfirmArchive(null); }}>Arquivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={archivedOpen} onOpenChange={setArchivedOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sprints arquivadas</DialogTitle></DialogHeader>
          {archivedSprints.length ? (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {archivedSprints.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px]">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{tasks.filter((t) => t.sprint_id === s.id).length} tarefa(s)</div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setSprintFilter(s.id); setArchivedOpen(false); }}>Consultar</Button>
                    <Button variant="outline" size="sm" onClick={() => setArchived(s, false)}>Restaurar</Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma sprint arquivada.</p>}
        </DialogContent>
      </Dialog>
      <TaskDetailPanel
        taskId={openTaskId}
        onOpenChange={(v) => !v && setOpenTaskId(null)}
        onChanged={() => void fetchTasks()}
        onOpenTask={(id) => setOpenTaskId(id)}
      />
    </>
  );
}

function QuickAddButton({ onCreate }: { onCreate: (t: string) => Promise<boolean> }) {
  return <div className="w-full max-w-sm"><QuickAdd onCreate={onCreate} /></div>;
}
