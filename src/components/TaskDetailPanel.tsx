import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play, Pause, Square, Plus, X, MoreHorizontal, Copy, Trash2, ArrowRightLeft, Check } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useClientes } from "@/components/crud/forms";
import { ConfirmDelete } from "@/components/crud/ConfirmDelete";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RichTextEditor } from "@/components/tasks/RichTextEditor";
import { TaskComments } from "@/components/tasks/TaskComments";
import {
  TASK_STATUS, PRIORITIES, normalizeStatus, normalizePriority, fmtDuration, fmtClock, parseDuration,
  DATE_MIN, DATE_MAX, isValidDateInput, useTeamMembers,
} from "@/lib/tasks";

const TAG_PALETTE = ["#B4532A", "#A16207", "#15803D", "#6B7280", "#374151", "#BE185D"];

type TaskRow = {
  id: string; titulo: string; descricao: string | null; status: string; prioridade: string;
  prazo: string | null; cliente_id: string | null; conteudo_id: string | null; sprint_id: string | null;
  assignee_id: string | null; tipo: string | null;
  timer_status: "stopped" | "running" | "paused" | null;
  tempo_total_segundos: number; timer_iniciado_em: string | null; timer_acumulado_segundos: number;
  tempo_estimado_minutos: number | null; created_at: string;
};
type SprintRef = { id: string; name: string };
type TagRow = { id: string; name: string; color: string };
type Subtask = { id: string; titulo: string; concluida: boolean; ordem: number };
type TimeEntry = { id: string; duracao_segundos: number; origem: string; data: string; user_id: string | null; observacao: string | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (t: string) => supabase.from(t as any) as any;

/* ---------------- Property row ---------------- */
function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-0.5 sm:grid-cols-[150px_1fr]">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
const ghostTrigger = "h-8 border-transparent bg-transparent px-2 shadow-none hover:bg-muted focus:ring-0 text-[13px] justify-start gap-2 [&>svg:last-child]:ml-auto";

/* ---------------- Tags ---------------- */
function TagsProp({ taskId }: { taskId: string }) {
  const [allTags, setAllTags] = useState<TagRow[]>([]);
  const [selected, setSelected] = useState<TagRow[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_PALETTE[0]);

  useEffect(() => {
    Promise.all([
      db("tags").select("id,name,color").order("name"),
      db("task_tags").select("tags(id,name,color)").eq("task_id", taskId),
    ]).then(([a, b]) => {
      setAllTags((a.data ?? []) as TagRow[]);
      setSelected(((b.data ?? []) as { tags: TagRow | null }[]).map((r) => r.tags).filter((t): t is TagRow => !!t));
    });
  }, [taskId]);

  const attach = async (tag: TagRow) => {
    if (selected.some((t) => t.id === tag.id)) return;
    setSelected((p) => [...p, tag]);
    const { error } = await db("task_tags").insert({ task_id: taskId, tag_id: tag.id });
    if (error) { toast.error("Não foi possível adicionar a tag."); setSelected((p) => p.filter((t) => t.id !== tag.id)); }
  };
  const detach = async (tag: TagRow) => {
    setSelected((p) => p.filter((t) => t.id !== tag.id));
    await db("task_tags").delete().eq("task_id", taskId).eq("tag_id", tag.id);
  };
  const create = async () => {
    if (!newName.trim()) return;
    const { data, error } = await db("tags").insert({ name: newName.trim(), color: newColor }).select().single();
    if (error) return toast.error("Não foi possível criar a tag.");
    setAllTags((p) => [...p, data as TagRow]); setNewName(""); await attach(data as TagRow);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 px-2">
      {selected.map((t) => (
        <span key={t.id} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px]" style={{ background: `${t.color}1f`, color: t.color }}>
          {t.name}<button type="button" onClick={() => detach(t)} aria-label={`Remover ${t.name}`}><X size={10} /></button>
        </span>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="inline-flex h-7 items-center gap-1 rounded px-1.5 text-[12px] text-muted-foreground hover:bg-muted"><Plus size={12} /> Tag</button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2" align="start">
          <div className="max-h-40 space-y-0.5 overflow-y-auto">
            {allTags.filter((t) => !selected.some((s) => s.id === t.id)).map((t) => (
              <button key={t.id} type="button" onClick={() => attach(t)} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[13px] hover:bg-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />{t.name}
              </button>
            ))}
          </div>
          <div className="mt-2 space-y-2 border-t border-border pt-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nova tag" className="h-8 text-[13px]" onKeyDown={(e) => e.key === "Enter" && void create()} />
            <div className="flex items-center gap-1.5">
              {TAG_PALETTE.map((c) => (
                <button key={c} type="button" onClick={() => setNewColor(c)} aria-label="Cor" className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: c }}>
                  {newColor === c && <Check size={11} className="text-background" />}
                </button>
              ))}
              <Button size="sm" className="ml-auto h-7" onClick={create}>Criar</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ---------------- Conteúdo relacionado ---------------- */
function ContentProp({ task, onSet }: { task: TaskRow; onSet: (v: string | null) => void }) {
  const [opts, setOpts] = useState<{ id: string; titulo: string | null; data_prevista: string | null }[]>([]);
  useEffect(() => {
    let q = db("conteudos").select("id,titulo,data_prevista").order("data_prevista", { ascending: false, nullsFirst: false }).limit(200);
    if (task.cliente_id) q = q.eq("cliente_id", task.cliente_id);
    q.then(async ({ data }: { data: typeof opts | null }) => {
      const list = data ?? [];
      if (task.conteudo_id && !list.some((c) => c.id === task.conteudo_id)) {
        const { data: one } = await db("conteudos").select("id,titulo,data_prevista").eq("id", task.conteudo_id).maybeSingle();
        setOpts(one ? [one, ...list] : list);
      } else setOpts(list);
    });
  }, [task.cliente_id, task.conteudo_id]);
  return (
    <div className="flex items-center gap-1">
      <Select value={task.conteudo_id ?? "none"} onValueChange={(v) => onSet(v === "none" ? null : v)}>
        <SelectTrigger className={ghostTrigger} aria-label="Conteúdo relacionado"><SelectValue placeholder="Nenhum" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Nenhum</SelectItem>
          {opts.map((c) => <SelectItem key={c.id} value={c.id}>{c.titulo || "Sem título"}{c.data_prevista ? ` · ${c.data_prevista.slice(8, 10)}/${c.data_prevista.slice(5, 7)}` : ""}</SelectItem>)}
        </SelectContent>
      </Select>
      {task.conteudo_id && <Link to="/admin/conteudo" search={{ c: task.conteudo_id }} className="shrink-0 px-2 text-[12px] text-primary hover:underline">Abrir</Link>}
    </div>
  );
}

/* ---------------- Subtarefas ---------------- */
function Subtasks({ taskId }: { taskId: string }) {
  const [items, setItems] = useState<Subtask[]>([]);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const load = useCallback(async () => {
    const { data } = await db("tarefa_subtarefas").select("id,titulo,concluida,ordem").eq("tarefa_id", taskId).order("ordem").order("created_at");
    setItems((data ?? []) as Subtask[]);
  }, [taskId]);
  useEffect(() => { void load(); }, [load]);
  const add = async () => {
    if (!text.trim()) return;
    const { error } = await db("tarefa_subtarefas").insert({ tarefa_id: taskId, titulo: text.trim(), ordem: items.length });
    if (error) return toast.error("Não foi possível criar a subtarefa.");
    setText(""); void load();
  };
  const patch = async (id: string, p: Partial<Subtask>) => {
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...p } : s)));
    const { error } = await db("tarefa_subtarefas").update(p).eq("id", id);
    if (error) { toast.error("Não foi possível salvar."); void load(); }
  };
  const remove = async (id: string) => {
    setItems((p) => p.filter((s) => s.id !== id));
    await db("tarefa_subtarefas").delete().eq("id", id);
  };
  const done = items.filter((i) => i.concluida).length;
  return (
    <div className="space-y-1">
      {items.length > 0 && <div className="mb-1 text-[12px] text-muted-foreground">{done} de {items.length} concluídas</div>}
      {items.map((s) => (
        <div key={s.id} className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-muted/50">
          <Checkbox checked={s.concluida} onCheckedChange={(v) => patch(s.id, { concluida: !!v })} aria-label={`Concluir ${s.titulo}`} />
          {editing === s.id ? (
            <Input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} className="h-7 text-[13px]"
              onBlur={() => { if (editText.trim()) void patch(s.id, { titulo: editText.trim() }); setEditing(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(null); }} />
          ) : (
            <button type="button" onClick={() => { setEditing(s.id); setEditText(s.titulo); }}
              className={`flex-1 text-left text-[14px] ${s.concluida ? "text-muted-foreground line-through" : "text-foreground"}`}>{s.titulo}</button>
          )}
          <button type="button" aria-label={`Excluir ${s.titulo}`} onClick={() => remove(s.id)} className="text-muted-foreground opacity-60 hover:text-destructive group-hover:opacity-100"><X size={14} /></button>
        </div>
      ))}
      <div className="flex items-center gap-2 px-1">
        <Plus size={14} className="text-muted-foreground" />
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Adicionar subtarefa…"
          className="h-8 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground" aria-label="Nova subtarefa" />
      </div>
    </div>
  );
}

/* ---------------- Tempo ---------------- */
function useSession(task: TaskRow) {
  const running = task.timer_status === "running";
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  const elapsed = running && task.timer_iniciado_em ? Math.max(0, Math.floor((Date.now() - new Date(task.timer_iniciado_em).getTime()) / 1000)) : 0;
  return (task.timer_acumulado_segundos ?? 0) + elapsed;
}

function TimeSection({ task, save, reload }: { task: TaskRow; save: (p: Partial<TaskRow>) => Promise<boolean>; reload: () => Promise<void> }) {
  const session = useSession(task);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [manual, setManual] = useState("");
  const [total, setTotal] = useState("");
  const [busy, setBusy] = useState(false);
  const status = task.timer_status ?? "stopped";

  const loadEntries = useCallback(async () => {
    const { data } = await db("tarefa_tempo_registros").select("id,duracao_segundos,origem,data,user_id,observacao").eq("tarefa_id", task.id).order("created_at", { ascending: false });
    setEntries((data ?? []) as TimeEntry[]);
  }, [task.id]);
  useEffect(() => { void loadEntries(); }, [loadEntries]);

  const addEntry = async (secs: number, origem: string, observacao?: string) => {
    const { error } = await db("tarefa_tempo_registros").insert({ tarefa_id: task.id, duracao_segundos: secs, origem, observacao: observacao ?? null });
    if (error) { toast.error("Não foi possível registrar o tempo."); return false; }
    await Promise.all([loadEntries(), reload()]);
    return true;
  };

  const start = () => save({ timer_status: "running", timer_iniciado_em: new Date().toISOString(), timer_acumulado_segundos: 0 });
  const pause = () => save({ timer_status: "paused", timer_iniciado_em: null, timer_acumulado_segundos: session });
  const resume = () => save({ timer_status: "running", timer_iniciado_em: new Date().toISOString() });
  const finish = async () => {
    setBusy(true);
    const secs = session;
    const ok = await save({ timer_status: "stopped", timer_iniciado_em: null, timer_acumulado_segundos: 0 });
    if (ok && secs > 0) await addEntry(secs, "cronometro");
    setBusy(false);
  };
  const addManual = async () => {
    const s = parseDuration(manual);
    if (!s) return toast.error("Informe o tempo, por exemplo 30min ou 1h30.");
    if (await addEntry(s, "manual")) setManual("");
  };
  const setRealizado = async () => {
    const s = parseDuration(total);
    if (s === null) return toast.error("Informe o tempo, por exemplo 2h12.");
    const delta = s - (task.tempo_total_segundos ?? 0);
    if (delta === 0) { setTotal(""); return; }
    if (await addEntry(delta, "ajuste", "Correção manual do tempo realizado")) setTotal("");
  };
  const removeEntry = async (id: string) => {
    await db("tarefa_tempo_registros").delete().eq("id", id);
    await Promise.all([loadEntries(), reload()]);
  };

  const est = task.tempo_estimado_minutos ? task.tempo_estimado_minutos * 60 : null;
  const ORIGEM: Record<string, string> = { cronometro: "Cronômetro", manual: "Manual", ajuste: "Ajuste" };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
        <div className="flex items-center gap-3">
          {status === "running" && <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />}
          <div>
            <div className="font-mono text-xl font-semibold tabular-nums text-foreground">{fmtClock(session)}</div>
            <div className="text-[11px] text-muted-foreground">{status === "running" ? "Cronômetro rodando" : status === "paused" ? "Pausado" : "Cronômetro parado"}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "stopped" && <Button size="sm" onClick={start} className="gap-1"><Play size={14} /> Iniciar</Button>}
          {status === "running" && <Button size="sm" variant="outline" onClick={pause} className="gap-1"><Pause size={14} /> Pausar</Button>}
          {status === "paused" && <Button size="sm" onClick={resume} className="gap-1"><Play size={14} /> Retomar</Button>}
          {status !== "stopped" && <Button size="sm" variant="outline" onClick={finish} disabled={busy} className="gap-1"><Square size={14} /> Finalizar</Button>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-[12px] text-muted-foreground">Lançar tempo manual</div>
          <div className="flex gap-2">
            <Input value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addManual()} placeholder="ex.: 30min, 1h30" className="h-8 text-[13px]" aria-label="Tempo manual" />
            <Button size="sm" variant="outline" className="h-8" onClick={addManual}>Adicionar</Button>
          </div>
        </div>
        <div>
          <div className="mb-1 text-[12px] text-muted-foreground">Corrigir tempo realizado (total atual {fmtDuration(task.tempo_total_segundos)})</div>
          <div className="flex gap-2">
            <Input value={total} onChange={(e) => setTotal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setRealizado()} placeholder="ex.: 2h12" className="h-8 text-[13px]" aria-label="Novo tempo realizado" />
            <Button size="sm" variant="outline" className="h-8" onClick={setRealizado}>Salvar</Button>
          </div>
        </div>
      </div>

      {est && <div className="text-[12px] text-muted-foreground">Realizado {fmtDuration(task.tempo_total_segundos)} de {fmtDuration(est)} estimados</div>}

      {entries.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-3 py-1.5 text-[13px]">
              <span className="w-20 tabular-nums text-foreground">{e.duracao_segundos < 0 ? "−" : ""}{fmtDuration(Math.abs(e.duracao_segundos))}</span>
              <span className="text-muted-foreground">{ORIGEM[e.origem] ?? e.origem}</span>
              <span className="ml-auto text-muted-foreground">{e.data.split("-").reverse().join("/")}</span>
              <button type="button" aria-label="Excluir registro" onClick={() => removeEntry(e.id)} className="text-muted-foreground hover:text-destructive"><X size={13} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-2 text-[13px] font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

/* ---------------- Main ---------------- */
export function TaskDetailPanel({
  taskId, onOpenChange, onChanged, onOpenTask,
}: {
  taskId: string | null;
  onOpenChange: (v: boolean) => void;
  onChanged?: () => void;
  onOpenTask?: (id: string) => void;
}) {
  const [task, setTask] = useState<TaskRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [sprints, setSprints] = useState<SprintRef[]>([]);
  const [confirmDel, setConfirmDel] = useState(false);
  const [title, setTitle] = useState("");
  const [estimate, setEstimate] = useState("");
  const clientes = useClientes();
  const members = useTeamMembers();
  const changedRef = useRef(onChanged);
  changedRef.current = onChanged;

  const reload = useCallback(async () => {
    if (!taskId) return;
    const { data, error } = await db("tarefas").select("*").eq("id", taskId).single();
    if (error) { toast.error("Não foi possível abrir a tarefa."); return; }
    setTask(data as TaskRow);
  }, [taskId]);

  useEffect(() => {
    if (!taskId) { setTask(null); return; }
    setLoading(true);
    Promise.all([reload(), db("sprints").select("id,name").order("start_date", { ascending: true, nullsFirst: false })])
      .then(([, s]) => { setSprints((s.data ?? []) as SprintRef[]); setLoading(false); });
  }, [taskId, reload]);

  useEffect(() => {
    if (task) { setTitle(task.titulo); setEstimate(task.tempo_estimado_minutos ? fmtDuration(task.tempo_estimado_minutos * 60) : ""); }
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Salva no banco e só então avisa as views (Kanban etc.) para recarregar. */
  const save = useCallback(async (patch: Partial<TaskRow>) => {
    if (!task) return false;
    setTask((p) => (p ? { ...p, ...patch } : p));
    const { error } = await db("tarefas").update(patch).eq("id", task.id);
    if (error) { void reload(); toast.error("Não foi possível salvar."); return false; }
    changedRef.current?.();
    return true;
  }, [task, reload]);

  const reloadAndNotify = useCallback(async () => { await reload(); changedRef.current?.(); }, [reload]);

  const duplicate = async () => {
    if (!task) return;
    const { data, error } = await db("tarefas").insert({
      titulo: `${task.titulo} (cópia)`, descricao: task.descricao, cliente_id: task.cliente_id, sprint_id: task.sprint_id,
      assignee_id: task.assignee_id, prioridade: task.prioridade, prazo: task.prazo, tipo: task.tipo ?? "outro",
      conteudo_id: task.conteudo_id, tempo_estimado_minutos: task.tempo_estimado_minutos, status: "not_started", timer_status: "stopped",
    }).select("id").single();
    if (error) return toast.error("Não foi possível duplicar.");
    const [tags, subs] = await Promise.all([
      db("task_tags").select("tag_id").eq("task_id", task.id),
      db("tarefa_subtarefas").select("titulo,ordem").eq("tarefa_id", task.id),
    ]);
    if (tags.data?.length) await db("task_tags").insert(tags.data.map((t: { tag_id: string }) => ({ task_id: data.id, tag_id: t.tag_id })));
    if (subs.data?.length) await db("tarefa_subtarefas").insert(subs.data.map((s: { titulo: string; ordem: number }) => ({ tarefa_id: data.id, titulo: s.titulo, ordem: s.ordem, concluida: false })));
    toast.success("Tarefa duplicada");
    changedRef.current?.();
    onOpenTask?.(data.id);
  };

  const remove = async () => {
    if (!task) return;
    const { error } = await db("tarefas").delete().eq("id", task.id);
    if (error) return toast.error("Não foi possível excluir.");
    toast.success("Tarefa excluída");
    setConfirmDel(false);
    changedRef.current?.();
    onOpenChange(false);
  };

  const assigneeOpts = useMemo(() => members, [members]);
  const assigneeUnknown = task?.assignee_id && !members.some((m) => m.id === task.assignee_id);

  return (
    <>
      <Dialog open={!!taskId} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[94vh] w-[calc(100%-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Tarefa</DialogTitle>
          <DialogDescription className="sr-only">Detalhe da tarefa</DialogDescription>
          <div className="flex items-center justify-end gap-1 border-b border-border px-3 py-2 pr-12">
            {task && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Ações da tarefa"><MoreHorizontal size={16} /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={duplicate}><Copy size={14} className="mr-2" /> Duplicar tarefa</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger><ArrowRightLeft size={14} className="mr-2" /> Mover para Sprint</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => save({ sprint_id: null })}>Sem sprint</DropdownMenuItem>
                      {sprints.map((s) => (
                        <DropdownMenuItem key={s.id} onClick={() => save({ sprint_id: s.id })}>
                          {s.name}{task.sprint_id === s.id ? " ✓" : ""}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setConfirmDel(true)} className="text-destructive focus:text-destructive">
                    <Trash2 size={14} className="mr-2" /> Excluir tarefa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4 sm:px-10">
            {loading && !task && <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
            {task && (
              <div className="space-y-5">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => { if (title.trim() && title !== task.titulo) void save({ titulo: title.trim() }); }}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  aria-label="Título da tarefa"
                  placeholder="Título da tarefa"
                  className="w-full bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                />

                <div className="space-y-0.5">
                  <Prop label="Status">
                    <Select value={normalizeStatus(task.status)} onValueChange={(v) => save({ status: v })}>
                      <SelectTrigger className={ghostTrigger} aria-label="Status"><SelectValue /></SelectTrigger>
                      <SelectContent>{TASK_STATUS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Prop>
                  <Prop label="Responsável">
                    <Select value={task.assignee_id ?? "none"} onValueChange={(v) => save({ assignee_id: v === "none" ? null : v })}>
                      <SelectTrigger className={ghostTrigger} aria-label="Responsável"><SelectValue placeholder="Vazio" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem responsável</SelectItem>
                        {assigneeUnknown && <SelectItem value={task.assignee_id!}>Membro removido</SelectItem>}
                        {assigneeOpts.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Prop>
                  <Prop label="Cliente">
                    <Select value={task.cliente_id ?? "none"} onValueChange={(v) => save({ cliente_id: v === "none" ? null : v })}>
                      <SelectTrigger className={ghostTrigger} aria-label="Cliente"><SelectValue placeholder="Vazio" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem cliente</SelectItem>
                        {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Prop>
                  <Prop label="Sprint">
                    <Select value={task.sprint_id ?? "none"} onValueChange={(v) => save({ sprint_id: v === "none" ? null : v })}>
                      <SelectTrigger className={ghostTrigger} aria-label="Sprint"><SelectValue placeholder="Vazio" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem sprint</SelectItem>
                        {sprints.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Prop>
                  <Prop label="Prioridade">
                    <Select value={normalizePriority(task.prioridade)} onValueChange={(v) => save({ prioridade: v })}>
                      <SelectTrigger className={ghostTrigger} aria-label="Prioridade"><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Prop>
                  <Prop label="Prazo">
                    <input
                      type="date" min={DATE_MIN} max={DATE_MAX} aria-label="Prazo"
                      value={task.prazo ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!isValidDateInput(v)) return;
                        void save({ prazo: v || null });
                      }}
                      className="h-8 rounded-md bg-transparent px-2 text-[13px] text-foreground outline-none hover:bg-muted"
                    />
                  </Prop>
                  <Prop label="Tags"><TagsProp taskId={task.id} /></Prop>
                  <Prop label="Conteúdo relacionado"><ContentProp task={task} onSet={(v) => save({ conteudo_id: v })} /></Prop>
                  <Prop label="Tempo estimado">
                    <input
                      value={estimate}
                      onChange={(e) => setEstimate(e.target.value)}
                      onBlur={() => {
                        if (!estimate.trim()) { if (task.tempo_estimado_minutos) void save({ tempo_estimado_minutos: null }); return; }
                        const s = parseDuration(estimate);
                        if (s === null) { toast.error("Use, por exemplo, 2h ou 45min."); return; }
                        setEstimate(fmtDuration(s));
                        void save({ tempo_estimado_minutos: Math.round(s / 60) });
                      }}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      placeholder="Vazio (ex.: 2h, 45min)" aria-label="Tempo estimado"
                      className="h-8 w-full rounded-md bg-transparent px-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground hover:bg-muted"
                    />
                  </Prop>
                  <Prop label="Tempo realizado">
                    <span className="px-2 text-[13px] text-foreground">{fmtDuration(task.tempo_total_segundos)}</span>
                  </Prop>
                </div>

                <Section title="Descrição">
                  <RichTextEditor value={task.descricao ?? ""} onSave={(html) => save({ descricao: html || null })} />
                </Section>
                <Section title="Subtarefas"><Subtasks taskId={task.id} /></Section>
                <Section title="Tempo"><TimeSection task={task} save={save} reload={reloadAndNotify} /></Section>
                <Section title="Comentários"><TaskComments taskId={task.id} members={members} onCount={() => changedRef.current?.()} /></Section>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDelete
        open={confirmDel}
        onOpenChange={setConfirmDel}
        onConfirm={remove}
        title="Excluir esta tarefa?"
        description="A tarefa, suas subtarefas, comentários e registros de tempo serão apagados. Esta ação não pode ser desfeita."
      />
    </>
  );
}
