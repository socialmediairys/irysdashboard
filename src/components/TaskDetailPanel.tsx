import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play, Pause, Square, Send, X, Plus, Check } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { C } from "@/components/Painel360";
import { useClientes } from "@/components/crud/forms";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TAG_PALETTE = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
];

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", bg: "#E5E7EB", fg: "#4B5563" },
  { value: "medium", label: "Medium", bg: "#FEF3C7", fg: "#92400E" },
  { value: "high", label: "High", bg: "#FEE2E2", fg: "#B91C1C" },
];

type TaskRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  prazo: string | null;
  cliente_id: string | null;
  sprint_id: string | null;
  assignee_id: string | null;
  timer_status: "stopped" | "running" | "paused" | null;
  tempo_total_segundos: number;
  timer_iniciado_em: string | null;
};

type ProfileRef = { id: string; nome: string | null };
type SprintRef = { id: string; name: string };
type TagRow = { id: string; name: string; color: string };
type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  author_id: string | null;
  author?: { nome: string | null } | null;
};

function normalizeStatus(s: string | null | undefined) {
  const v = (s ?? "").toLowerCase();
  if (["in_progress", "em_andamento", "doing"].includes(v)) return "in_progress";
  if (["done", "concluida", "concluído"].includes(v)) return "done";
  return "not_started";
}

function normalizePriority(p: string | null | undefined) {
  const v = (p ?? "").toLowerCase();
  if (["high", "alta", "urgente"].includes(v)) return "high";
  if (["low", "baixa"].includes(v)) return "low";
  return "medium";
}

function fmtDuration(total: number) {
  const t = Math.max(0, Math.floor(total));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

/* ---------------- Field autosave hook ---------------- */

function useAutosaveField<T>(
  taskId: string | null,
  column: string,
  initial: T,
  debounceMs = 500,
) {
  const [value, setValue] = useState<T>(initial);
  const timer = useRef<number | null>(null);
  const lastSaved = useRef<T>(initial);

  useEffect(() => {
    setValue(initial);
    lastSaved.current = initial;
  }, [initial, taskId]);

  const save = useCallback(
    async (v: T) => {
      if (!taskId) return;
      if (v === lastSaved.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("tarefas" as any) as any)
        .update({ [column]: v })
        .eq("id", taskId);
      if (error) {
        toast.error(`Erro ao salvar ${column}: ${error.message}`);
        return;
      }
      lastSaved.current = v;
    },
    [taskId, column],
  );

  const onChange = useCallback(
    (v: T) => {
      setValue(v);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void save(v), debounceMs);
    },
    [save, debounceMs],
  );

  const flush = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    void save(value);
  }, [save, value]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return { value, onChange, flush };
}

/* ---------------- Sections ---------------- */

function FieldsSection({
  task,
  clientes,
  sprints,
  profiles,
  onLocalChange,
}: {
  task: TaskRow;
  clientes: { id: string; nome: string }[];
  sprints: SprintRef[];
  profiles: ProfileRef[];
  onLocalChange: (patch: Partial<TaskRow>) => void;
}) {
  const titulo = useAutosaveField(task.id, "titulo", task.titulo);
  const descricao = useAutosaveField(task.id, "descricao", task.descricao ?? "");

  const setField = async (col: keyof TaskRow, v: unknown) => {
    onLocalChange({ [col]: v as never });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("tarefas" as any) as any)
      .update({ [col]: v })
      .eq("id", task.id);
    if (error) toast.error(`Erro ao salvar: ${error.message}`);
  };

  const prio = PRIORITY_OPTIONS.find((p) => p.value === normalizePriority(task.prioridade))!;

  return (
    <div className="space-y-4">
      <Input
        value={titulo.value}
        onChange={(e) => titulo.onChange(e.target.value)}
        onBlur={titulo.flush}
        placeholder="Título da tarefa"
        className="text-lg font-bold border-0 border-b rounded-none px-0 focus-visible:ring-0"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold" style={{ color: C.textMid }}>Assignee</label>
          <Select value={task.assignee_id ?? "none"} onValueChange={(v) => setField("assignee_id", v === "none" ? null : v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nome ?? "?"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold" style={{ color: C.textMid }}>Status</label>
          <Select value={normalizeStatus(task.status)} onValueChange={(v) => setField("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold" style={{ color: C.textMid }}>Due date</label>
          <Input
            type="date"
            value={task.prazo ?? ""}
            onChange={(e) => setField("prazo", e.target.value || null)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold" style={{ color: C.textMid }}>Cliente</label>
          <Select value={task.cliente_id ?? "none"} onValueChange={(v) => setField("cliente_id", v === "none" ? null : v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold" style={{ color: C.textMid }}>Sprint</label>
          <Select value={task.sprint_id ?? "none"} onValueChange={(v) => setField("sprint_id", v === "none" ? null : v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {sprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold" style={{ color: C.textMid }}>Prioridade</label>
          <Select value={normalizePriority(task.prioridade)} onValueChange={(v) => setField("prioridade", v)}>
            <SelectTrigger>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: prio.bg, color: prio.fg }}
              >
                {prio.label}
              </span>
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold" style={{ color: C.textMid }}>Descrição</label>
        <Textarea
          rows={4}
          value={descricao.value}
          onChange={(e) => descricao.onChange(e.target.value)}
          onBlur={descricao.flush}
          placeholder="Detalhes da tarefa..."
        />
      </div>
    </div>
  );
}

/* ---------------- Tags ---------------- */

function TagsSection({ taskId }: { taskId: string }) {
  const [allTags, setAllTags] = useState<TagRow[]>([]);
  const [selected, setSelected] = useState<TagRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_PALETTE[0]);

  const load = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [tagsRes, linkRes] = await Promise.all([
        (supabase.from("tags" as any) as any).select("id,name,color").order("name"),
        (supabase.from("task_tags" as any) as any).select("tag_id,tags(id,name,color)").eq("task_id", taskId),
      ]);
      setAllTags((tagsRes.data ?? []) as TagRow[]);
      setSelected(((linkRes.data ?? []) as { tags: TagRow | null }[]).map((r) => r.tags).filter((t): t is TagRow => !!t));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar tags";
      toast.error(msg);
    }
  }, [taskId]);

  useEffect(() => { void load(); }, [load]);

  const attach = async (tag: TagRow) => {
    if (selected.some((t) => t.id === tag.id)) return;
    setSelected((prev) => [...prev, tag]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("task_tags" as any) as any).insert({ task_id: taskId, tag_id: tag.id });
    if (error) {
      toast.error(error.message);
      setSelected((prev) => prev.filter((t) => t.id !== tag.id));
    }
  };

  const detach = async (tag: TagRow) => {
    setSelected((prev) => prev.filter((t) => t.id !== tag.id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("task_tags" as any) as any)
      .delete().eq("task_id", taskId).eq("tag_id", tag.id);
    if (error) {
      toast.error(error.message);
      setSelected((prev) => [...prev, tag]);
    }
  };

  const createTag = async () => {
    if (!newName.trim()) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("tags" as any) as any)
      .insert({ name: newName.trim(), color: newColor }).select().single();
    if (error) {
      toast.error(error.message);
      return;
    }
    const tag = data as TagRow;
    setAllTags((prev) => [...prev, tag]);
    await attach(tag);
    setNewName("");
    setCreating(false);
  };

  const available = allTags.filter((t) => !selected.some((s) => s.id === t.id));

  return (
    <div>
      <label className="text-xs font-semibold" style={{ color: C.textMid }}>Tags</label>
      <div className="flex flex-wrap items-center gap-1.5 mt-1 min-h-[36px] rounded-md border border-input bg-background p-2">
        {selected.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}55` }}
          >
            {t.name}
            <button type="button" onClick={() => detach(t)} aria-label={`Remover ${t.name}`}>
              <X size={10} />
            </button>
          </span>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border border-dashed"
              style={{ color: C.textMid, borderColor: C.textMuted }}
            >
              <Plus size={10} /> tag
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="max-h-40 overflow-y-auto space-y-1">
              {available.length === 0 && !creating && (
                <div className="text-xs italic px-2 py-1" style={{ color: C.textMuted }}>
                  Nenhuma tag disponível.
                </div>
              )}
              {available.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => attach(t)}
                  className="w-full text-left flex items-center gap-2 px-2 py-1 rounded hover:bg-muted"
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: t.color }} />
                  <span className="text-xs">{t.name}</span>
                </button>
              ))}
            </div>
            <div className="pt-2 mt-2 border-t">
              {!creating ? (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="w-full text-left text-xs font-semibold px-2 py-1 rounded hover:bg-muted"
                  style={{ color: C.mid }}
                >
                  + Nova tag
                </button>
              ) : (
                <div className="space-y-2">
                  <Input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome"
                    className="h-8 text-xs"
                    onKeyDown={(e) => e.key === "Enter" && void createTag()}
                  />
                  <div className="flex items-center gap-1.5">
                    {TAG_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        aria-label={c}
                        className="h-6 w-6 rounded-full flex items-center justify-center"
                        style={{ background: c, outline: newColor === c ? "2px solid #000" : "none" }}
                      >
                        {newColor === c && <Check size={12} color="#fff" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={createTag} className="flex-1 h-8">Criar</Button>
                    <Button size="sm" variant="outline" onClick={() => setCreating(false)} className="h-8">Cancelar</Button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/* ---------------- Timer ---------------- */

function TimerSection({
  task,
  onLocalChange,
}: {
  task: TaskRow;
  onLocalChange: (patch: Partial<TaskRow>) => void;
}) {
  const [tick, setTick] = useState(0);
  const running = task.timer_status === "running";

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const totalNow = useMemo(() => {
    void tick;
    let s = task.tempo_total_segundos ?? 0;
    if (running && task.timer_iniciado_em) {
      s += Math.max(0, Math.floor((Date.now() - new Date(task.timer_iniciado_em).getTime()) / 1000));
    }
    return s;
  }, [tick, running, task.tempo_total_segundos, task.timer_iniciado_em]);

  const update = async (patch: Partial<TaskRow>) => {
    onLocalChange(patch);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("tarefas" as any) as any).update(patch).eq("id", task.id);
    if (error) toast.error(error.message);
  };

  const start = () => {
    void update({ timer_status: "running", timer_iniciado_em: new Date().toISOString() });
  };

  const accumulate = (): number => {
    if (!task.timer_iniciado_em) return task.tempo_total_segundos ?? 0;
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(task.timer_iniciado_em).getTime()) / 1000));
    return (task.tempo_total_segundos ?? 0) + elapsed;
  };

  const pause = () => {
    void update({ timer_status: "paused", tempo_total_segundos: accumulate(), timer_iniciado_em: null });
  };

  const stop = () => {
    void update({ timer_status: "stopped", tempo_total_segundos: accumulate(), timer_iniciado_em: null });
  };

  return (
    <div className="rounded-[10px] p-3 flex items-center justify-between" style={{ background: C.beigeLight }}>
      <div className="flex items-center gap-3">
        {running && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "#10B981" }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: "#10B981" }} />
          </span>
        )}
        <div>
          <div className="text-2xl font-mono font-bold" style={{ color: C.dark }}>
            {fmtDuration(totalNow)}
          </div>
          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted }}>
            {running ? "Rodando" : task.timer_status === "paused" ? "Pausado" : "Parado"}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {!running && (
          <Button size="sm" onClick={start} className="gap-1"><Play size={14} /> Iniciar</Button>
        )}
        {running && (
          <Button size="sm" variant="outline" onClick={pause} className="gap-1"><Pause size={14} /> Pausar</Button>
        )}
        {task.timer_status !== "stopped" && (
          <Button size="sm" variant="outline" onClick={stop} className="gap-1"><Square size={14} /> Finalizar</Button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Comments ---------------- */

function CommentsSection({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("task_comments" as any) as any)
      .select("id,content,created_at,author_id,author:profiles(nome)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setComments((data ?? []) as CommentRow[]);
  }, [taskId]);

  useEffect(() => { void load(); }, [load]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    const { data: u } = await supabase.auth.getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("task_comments" as any) as any).insert({
      task_id: taskId,
      author_id: u.user?.id ?? null,
      content: text.trim(),
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
    void load();
  };

  return (
    <div>
      <label className="text-xs font-semibold" style={{ color: C.textMid }}>Comentários</label>
      <div className="mt-1 space-y-2 max-h-64 overflow-y-auto">
        {loading && <div className="text-xs" style={{ color: C.textMuted }}>Carregando...</div>}
        {!loading && comments.length === 0 && (
          <div className="text-xs italic" style={{ color: C.textMuted }}>Nenhum comentário ainda.</div>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-[10px] p-2.5" style={{ background: C.beigeLight }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: C.dark }}>{c.author?.nome ?? "Usuário"}</span>
              <span className="text-[10px]" style={{ color: C.textMuted }}>{relativeTime(c.created_at)}</span>
            </div>
            <div className="text-sm mt-1 whitespace-pre-wrap">{c.content}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <Textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva um comentário..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button type="button" onClick={send} disabled={sending || !text.trim()} className="self-end">
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Main panel ---------------- */

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

export function TaskDetailPanel({
  taskId,
  onOpenChange,
  onChanged,
}: {
  taskId: string | null;
  onOpenChange: (v: boolean) => void;
  onChanged?: () => void;
}) {
  const [task, setTask] = useState<TaskRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [sprints, setSprints] = useState<SprintRef[]>([]);
  const [profiles, setProfiles] = useState<ProfileRef[]>([]);
  const clientes = useClientes();

  useEffect(() => {
    if (!taskId) { setTask(null); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [tRes, sRes, pRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("tarefas" as any) as any).select("*").eq("id", taskId).single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("sprints" as any) as any).select("id,name").order("start_date", { ascending: true, nullsFirst: false }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("profiles" as any) as any).select("id,nome").order("nome"),
      ]);
      if (cancelled) return;
      setLoading(false);
      if (tRes.error) {
        toast.error(tRes.error.message);
        return;
      }
      setTask(tRes.data as TaskRow);
      setSprints((sRes.data ?? []) as SprintRef[]);
      setProfiles((pRes.data ?? []) as ProfileRef[]);
    })();
    return () => { cancelled = true; };
  }, [taskId]);

  const applyLocal = useCallback((patch: Partial<TaskRow>) => {
    setTask((prev) => (prev ? { ...prev, ...patch } : prev));
    onChanged?.();
  }, [onChanged]);

  return (
    <Sheet open={!!taskId} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes da tarefa</SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {task && (
          <div className="space-y-6 mt-4">
            <ErrorBoundary>
              <FieldsSection
                task={task}
                clientes={clientes}
                sprints={sprints}
                profiles={profiles}
                onLocalChange={applyLocal}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <TagsSection taskId={task.id} />
            </ErrorBoundary>
            <ErrorBoundary>
              <TimerSection task={task} onLocalChange={applyLocal} />
            </ErrorBoundary>
            <ErrorBoundary>
              <CommentsSection taskId={task.id} />
            </ErrorBoundary>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
