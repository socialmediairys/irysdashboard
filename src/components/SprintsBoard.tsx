import { useEffect, useMemo, useState } from "react";
import { Plus, MessageCircle } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { C, Card, PillBtn, PageHeader } from "@/components/Painel360";
import { ListState } from "@/components/ListState";
import { useClientes } from "@/components/crud/forms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SHADOW = "0 2px 16px rgba(44,21,5,0.09)";

type SprintRow = {
  id: string;
  name: string;
  status: "current" | "next" | "future";
  start_date: string | null;
  end_date: string | null;
};

type TaskRow = {
  id: string;
  titulo: string;
  status: string;
  prioridade: string;
  sprint_id: string | null;
  cliente_id: string | null;
  assignee_id: string | null;
};

type TagRow = { id: string; name: string; color: string };

const COLS: { key: string; label: string }[] = [
  { key: "not_started", label: "Not started" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

const PRIORITY_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  high: { bg: "#FEE2E2", fg: "#B91C1C", label: "High" },
  medium: { bg: "#FEF3C7", fg: "#92400E", label: "Medium" },
  low: { bg: "#E5E7EB", fg: "#4B5563", label: "Low" },
};

function normalizeStatus(s: string | null | undefined): string {
  const v = (s ?? "").toLowerCase();
  if (["in_progress", "em_andamento", "doing"].includes(v)) return "in_progress";
  if (["done", "concluida", "concluído", "concluida"].includes(v)) return "done";
  return "not_started";
}

function normalizePriority(p: string | null | undefined): "high" | "medium" | "low" {
  const v = (p ?? "").toLowerCase();
  if (["high", "alta", "urgente"].includes(v)) return "high";
  if (["low", "baixa"].includes(v)) return "low";
  return "medium";
}

function PriorityBadge({ priority }: { priority: string }) {
  const s = PRIORITY_STYLES[normalizePriority(priority)];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

function TagChip({ tag }: { tag: TagRow }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}55` }}
    >
      {tag.name}
    </span>
  );
}

function Avatar({ label }: { label: string }) {
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
      style={{ background: C.beigeLight, color: C.textMid }}
      title={label}
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}

/* ---------------- Kanban primitives (same pattern as CRM board) ---------------- */

type CardData = {
  task: TaskRow;
  clientName: string | null;
  tags: TagRow[];
  commentCount: number;
  assigneeName: string | null;
};

function TaskCard({ data, onOpen, dragHandle }: { data: CardData; onOpen: () => void; dragHandle: React.HTMLAttributes<HTMLButtonElement> }) {
  const { task, clientName, tags, commentCount, assigneeName } = data;
  return (
    <div className="rounded-[10px] bg-white p-3" style={{ boxShadow: SHADOW }}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left">
          <div className="font-semibold text-sm">{task.titulo}</div>
          {clientName && (
            <div className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
              {clientName}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <PriorityBadge priority={task.prioridade} />
            {tags.map((t) => (
              <TagChip key={t.id} tag={t} />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {assigneeName && <Avatar label={assigneeName} />}
            {commentCount > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ color: C.textMuted }}
              >
                <MessageCircle size={12} />
                {commentCount}
              </span>
            )}
          </div>
        </button>
        <button
          type="button"
          aria-label="Arrastar"
          className="cursor-grab active:cursor-grabbing rounded p-1 text-xs shrink-0"
          style={{ color: C.textMid }}
          {...dragHandle}
        >
          ⋮⋮
        </button>
      </div>
    </div>
  );
}

function SortableTask({ data, onOpen }: { data: CardData; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: data.task.id,
    data: { status: normalizeStatus(data.task.status) },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard data={data} onOpen={onOpen} dragHandle={listeners as unknown as React.HTMLAttributes<HTMLButtonElement>} />
    </div>
  );
}


function DroppableColumn({
  colKey,
  label,
  count,
  onNewTask,
  children,
}: {
  colKey: string;
  label: string;
  count: number;
  onNewTask: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${colKey}`, data: { status: colKey } });
  return (
    <div
      ref={setNodeRef}
      className="rounded-[12px] p-3 flex flex-col min-h-[320px]"
      style={{ background: isOver ? "#F7F0E0" : C.beigeLight, transition: "background 120ms" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.textMid }}>
          {label}
        </span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "#fff", color: C.textMid }}
        >
          {count}
        </span>
      </div>
      <div className="space-y-2 flex-1">
        {count === 0 && (
          <div className="text-xs italic text-center py-6" style={{ color: C.textMuted }}>
            Solte um card aqui
          </div>
        )}
        {children}
      </div>
      <button
        type="button"
        onClick={onNewTask}
        className="mt-3 w-full rounded-[8px] border border-dashed py-2 text-xs font-semibold hover:bg-white/60"
        style={{ borderColor: C.textMuted, color: C.textMid }}
      >
        <Plus size={12} className="inline mr-1" /> New task
      </button>
    </div>
  );
}

/* ---------------- Dialogs ---------------- */

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
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="next">Next</SelectItem>
                <SelectItem value="future">Future</SelectItem>
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

function NewTaskDialog({
  open,
  onOpenChange,
  sprintId,
  defaultStatus,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sprintId: string | null;
  defaultStatus: string;
  onCreated: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!titulo.trim()) {
      toast.error("Informe o título");
      return;
    }
    if (!sprintId) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("tarefas" as any) as any).insert({
      titulo: titulo.trim(),
      sprint_id: sprintId,
      status: defaultStatus,
      tipo: "outro",
      prioridade: "medium",
      timer_status: "stopped",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tarefa criada");
    setTitulo("");
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold">Título</label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Descreva a tarefa"
              autoFocus
            />
          </div>
          <p className="text-xs" style={{ color: C.textMuted }}>
            Os demais campos podem ser editados no painel de detalhes.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando..." : "Criar tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Main page ---------------- */

export function SprintsBoard() {
  const [sprints, setSprints] = useState<SprintRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [tagsByTask, setTagsByTask] = useState<Record<string, TagRow[]>>({});
  const [commentsByTask, setCommentsByTask] = useState<Record<string, number>>({});
  const [assigneeNames, setAssigneeNames] = useState<Record<string, string>>({});
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [override, setOverride] = useState<Record<string, string>>({});
  const [newSprintOpen, setNewSprintOpen] = useState(false);
  const [newTaskCol, setNewTaskCol] = useState<string | null>(null);

  const clientes = useClientes();
  const clientNameById = useMemo(() => {
    const m: Record<string, string> = {};
    clientes.forEach((c) => (m[c.id] = c.nome));
    return m;
  }, [clientes]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const fetchSprints = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase.from("sprints" as any) as any)
      .select("id,name,status,start_date,end_date")
      .order("start_date", { ascending: true, nullsFirst: false });
    if (err) {
      setError(err.message);
      return [] as SprintRow[];
    }
    const rows = (data ?? []) as SprintRow[];
    setSprints(rows);
    return rows;
  };

  const fetchTasksFor = async (sprintId: string) => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase.from("tarefas" as any) as any)
      .select("id,titulo,status,prioridade,sprint_id,cliente_id,assignee_id")
      .eq("sprint_id", sprintId);
    if (err) {
      setError(err.message);
      setTasks([]);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as TaskRow[];
    setTasks(rows);
    setError(null);

    const taskIds = rows.map((r) => r.id);
    const assigneeIds = Array.from(new Set(rows.map((r) => r.assignee_id).filter(Boolean))) as string[];

    // tags
    if (taskIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tt } = await (supabase.from("task_tags" as any) as any)
        .select("task_id,tags(id,name,color)")
        .in("task_id", taskIds);
      const map: Record<string, TagRow[]> = {};
      (tt ?? []).forEach((r: { task_id: string; tags: TagRow | null }) => {
        if (!r.tags) return;
        (map[r.task_id] ||= []).push(r.tags);
      });
      setTagsByTask(map);

      // comments count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cc } = await (supabase.from("task_comments" as any) as any)
        .select("task_id")
        .in("task_id", taskIds);
      const counts: Record<string, number> = {};
      (cc ?? []).forEach((r: { task_id: string }) => {
        counts[r.task_id] = (counts[r.task_id] ?? 0) + 1;
      });
      setCommentsByTask(counts);
    } else {
      setTagsByTask({});
      setCommentsByTask({});
    }

    // assignees
    if (assigneeIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pp } = await (supabase.from("profiles" as any) as any)
        .select("id,nome")
        .in("id", assigneeIds);
      const m: Record<string, string> = {};
      (pp ?? []).forEach((p: { id: string; nome: string | null }) => {
        m[p.id] = p.nome ?? "?";
      });
      setAssigneeNames(m);
    } else {
      setAssigneeNames({});
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const s = await fetchSprints();
      const current = s.find((x) => x.status === "current") ?? s[0];
      if (current) setSelectedSprintId(current.id);
      else setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (selectedSprintId) {
      setOverride({});
      fetchTasksFor(selectedSprintId);
    }
  }, [selectedSprintId]);

  const displayTasks = useMemo(
    () => tasks.map((t) => ({ ...t, status: override[t.id] ?? normalizeStatus(t.status) })),
    [tasks, override],
  );

  const columns = COLS.map((col) => ({
    ...col,
    items: displayTasks.filter((t) => normalizeStatus(t.status) === col.key),
  }));

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const from = (active.data.current as { status?: string } | undefined)?.status;
    let to: string | undefined = (over.data.current as { status?: string } | undefined)?.status;
    if (!to && overId.startsWith("col:")) to = overId.slice(4);
    if (!to || !from || to === from) return;
    if (!COLS.some((c) => c.key === to)) return;

    setOverride((prev) => ({ ...prev, [activeId]: to! }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase.from("tarefas" as any) as any)
      .update({ status: to })
      .eq("id", activeId);
    if (err) {
      setOverride((prev) => {
        const n = { ...prev };
        delete n[activeId];
        return n;
      });
      toast.error(err.message);
    } else {
      toast.success(`Movido para "${COLS.find((c) => c.key === to)?.label}"`);
      setTasks((prev) => prev.map((t) => (t.id === activeId ? { ...t, status: to! } : t)));
    }
  };

  const buildCardData = (t: TaskRow): CardData => ({
    task: t,
    clientName: t.cliente_id ? clientNameById[t.cliente_id] ?? null : null,
    tags: tagsByTask[t.id] ?? [],
    commentCount: commentsByTask[t.id] ?? 0,
    assigneeName: t.assignee_id ? assigneeNames[t.assignee_id] ?? null : null,
  });

  return (
    <>
      <PageHeader
        eyebrow="Produção"
        title="Sprint"
        accent="comercial"
        actions={
          <PillBtn onClick={() => setNewSprintOpen(true)}>
            <Plus size={14} className="inline mr-1" /> New sprint
          </PillBtn>
        }
      />

      {sprints.length === 0 ? (
        <Card>
          <ListState
            loading={loading}
            error={error}
            rows={[]}
            onRetry={fetchSprints}
            emptyTitle="Nenhuma sprint cadastrada"
            emptyDescription="Crie sua primeira sprint para começar."
            actionLabel="New sprint"
            onAction={() => setNewSprintOpen(true)}
          >
            <div />
          </ListState>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {sprints.map((s) => {
              const active = s.id === selectedSprintId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSprintId(s.id)}
                  className="rounded-full px-4 py-1.5 text-sm font-semibold transition"
                  style={{
                    background: active ? C.mid : "#fff",
                    color: active ? "#fff" : C.textMid,
                    boxShadow: SHADOW,
                  }}
                >
                  {s.name}
                  {s.status === "current" && (
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: active ? "rgba(255,255,255,0.25)" : "#FEF3C7",
                        color: active ? "#fff" : "#92400E",
                      }}
                    >
                      Current
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Card>
            <ListState
              loading={loading}
              error={error}
              rows={displayTasks}
              onRetry={() => selectedSprintId && fetchTasksFor(selectedSprintId)}
              emptyTitle="Nenhuma tarefa nesta sprint"
              emptyDescription="Clique em + New task em qualquer coluna para adicionar."
            >
              <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {columns.map((col) => (
                    <SortableContext
                      key={col.key}
                      items={col.items.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <DroppableColumn
                        colKey={col.key}
                        label={col.label}
                        count={col.items.length}
                        onNewTask={() => setNewTaskCol(col.key)}
                      >
                        {col.items.map((t) => (
                          <SortableTask key={t.id} data={buildCardData(t)} />
                        ))}
                      </DroppableColumn>
                    </SortableContext>
                  ))}
                </div>
              </DndContext>
            </ListState>
          </Card>
        </>
      )}

      <NewSprintDialog
        open={newSprintOpen}
        onOpenChange={setNewSprintOpen}
        onCreated={async (id) => {
          await fetchSprints();
          setSelectedSprintId(id);
        }}
      />
      <NewTaskDialog
        open={newTaskCol !== null}
        onOpenChange={(v) => !v && setNewTaskCol(null)}
        sprintId={selectedSprintId}
        defaultStatus={newTaskCol ?? "not_started"}
        onCreated={() => selectedSprintId && fetchTasksFor(selectedSprintId)}
      />
    </>
  );
}
