import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Plus,
  MessageCircle,
  Paperclip,
  Play,
  Pause,
  Clock,
  Send,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSupabaseList } from "@/hooks/useSupabaseList";
import { useCrud } from "@/components/crud/CrudProvider";
import {
  useClientes,
  type ClienteRef,
  TAREFA_STATUS,
  TAREFA_PRIORIDADE,
  TAREFA_TIPOS,
} from "@/components/crud/forms";
import { C, Card, PillBtn, MetricCard, PageHeader } from "@/components/Painel360";
import { ListState } from "@/components/ListState";
import { FileUploader } from "@/components/FileUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const SHADOW = "0 2px 16px rgba(44,21,5,0.09)";

/* ================================================================
 * Tipos
 * ================================================================ */
export type TarefaRow = {
  id: string;
  titulo: string;
  cliente_id: string | null;
  tipo: string;
  status: string;
  prioridade: string;
  prazo: string | null;
  descricao: string | null;
  tempo_total_segundos: number;
  timer_iniciado_em: string | null;
  created_at: string;
  updated_at: string;
};

type ComentarioRow = {
  id: string;
  tarefa_id: string;
  autor_id: string | null;
  conteudo: string;
  created_at: string;
  autor: { nome: string | null } | null;
};

type AnexoRow = {
  id: string;
  nome_original: string;
  nome_storage: string;
  bucket: string;
  url_publica: string | null;
  tamanho_bytes: number | null;
  created_at: string;
};

/* ================================================================
 * Helpers
 * ================================================================ */
const PRIORIDADE_COLORS: Record<string, { bg: string; fg: string }> = {
  Baixa: { bg: "#DDE9F2", fg: "#1E4F7A" },
  Média: { bg: "#FFF3CD", fg: "#8A6914" },
  Alta: { bg: "#FFE0B2", fg: "#A8431E" },
  Urgente: { bg: "#FEE2E2", fg: "#B91C1C" },
};

function PrioridadeBadge({ prioridade }: { prioridade: string }) {
  const c = PRIORIDADE_COLORS[prioridade] ?? PRIORIDADE_COLORS.Média;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: c.bg, color: c.fg }}
    >
      {prioridade}
    </span>
  );
}

function fmtDateBR(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y.slice(2)}`;
}

function fmtDateTimeBR(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtBytes(n: number | null) {
  if (!n) return "—";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Segundos acumulados + (se rodando) o tempo desde que o timer foi iniciado. */
function liveSeconds(
  t: Pick<TarefaRow, "tempo_total_segundos" | "timer_iniciado_em">,
  tick: number,
): number {
  void tick; // força recálculo a cada tick do relógio
  let total = t.tempo_total_segundos ?? 0;
  if (t.timer_iniciado_em) {
    const elapsed = Math.floor((Date.now() - new Date(t.timer_iniciado_em).getTime()) / 1000);
    total += Math.max(0, elapsed);
  }
  return total;
}

function fmtDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

async function startTimer(t: TarefaRow) {
  if (t.timer_iniciado_em) return;
  const { error } = await supabase
    .from("tarefas")
    .update({ timer_iniciado_em: new Date().toISOString() })
    .eq("id", t.id);
  if (error) toast.error(error.message);
}

async function pauseTimer(t: TarefaRow) {
  if (!t.timer_iniciado_em) return;
  const elapsed = Math.max(
    0,
    Math.floor((Date.now() - new Date(t.timer_iniciado_em).getTime()) / 1000),
  );
  const { error } = await supabase
    .from("tarefas")
    .update({
      tempo_total_segundos: (t.tempo_total_segundos ?? 0) + elapsed,
      timer_iniciado_em: null,
    })
    .eq("id", t.id);
  if (error) toast.error(error.message);
  else toast.success(`Tempo registrado: ${fmtDuration(elapsed)}`);
}

/* ================================================================
 * Contadores auxiliares (comentários / anexos) por card
 * ================================================================ */
function useCounts(table: "tarefa_comentarios" | "arquivos", tarefaIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (tarefaIds.length === 0) {
      setCounts({});
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from(table).select("tarefa_id").in("tarefa_id", tarefaIds);
      if (cancelled || !data) return;
      const next: Record<string, number> = {};
      for (const row of data as { tarefa_id: string }[]) {
        next[row.tarefa_id] = (next[row.tarefa_id] ?? 0) + 1;
      }
      setCounts(next);
    })();
    const channel = supabase
      .channel(`realtime-counts-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        void (async () => {
          const { data } = await supabase
            .from(table)
            .select("tarefa_id")
            .in("tarefa_id", tarefaIds);
          if (!data) return;
          const next: Record<string, number> = {};
          for (const row of data as { tarefa_id: string }[]) {
            next[row.tarefa_id] = (next[row.tarefa_id] ?? 0) + 1;
          }
          setCounts(next);
        })();
      })
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, tarefaIds.join(",")]);

  return counts;
}

/* ================================================================
 * Kanban — card + coluna
 * ================================================================ */
function TarefaCard({
  tarefa,
  clienteNome,
  commentCount,
  attachCount,
  tick,
  onOpen,
  onDelete,
  dragHandle,
}: {
  tarefa: TarefaRow;
  clienteNome: string | null;
  commentCount: number;
  attachCount: number;
  tick: number;
  onOpen: () => void;
  onDelete: () => void;
  dragHandle: Record<string, unknown>;
}) {
  const running = !!tarefa.timer_iniciado_em;
  return (
    <div className="rounded-[10px] bg-white p-3" style={{ boxShadow: SHADOW }}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" className="flex-1 text-left min-w-0" onClick={onOpen}>
          <div className="font-semibold text-sm truncate">{tarefa.titulo}</div>
          <div className="text-[11px] mt-1 truncate" style={{ color: C.textMuted }}>
            {clienteNome ?? "Sem cliente"}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <PrioridadeBadge prioridade={tarefa.prioridade} />
            {tarefa.prazo && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: C.beigeLight, color: C.textMid }}
              >
                {fmtDateBR(tarefa.prazo)}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px]" style={{ color: C.textMid }}>
            {commentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={12} /> {commentCount}
              </span>
            )}
            {attachCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Paperclip size={12} /> {attachCount}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 font-bold"
              style={{ color: running ? "#2E7D32" : C.textMid }}
            >
              <Clock size={12} />
              {fmtDuration(liveSeconds(tarefa, tick))}
              {running && (
                <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse ml-0.5" />
              )}
            </span>
          </div>
        </button>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="Arrastar"
            className="cursor-grab active:cursor-grabbing rounded p-1 text-xs"
            style={{ color: C.textMid }}
            {...dragHandle}
          >
            ⋮⋮
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Excluir"
            className="text-[10px]"
            style={{ color: "#B91C1C" }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function SortableTarefa(props: {
  tarefa: TarefaRow;
  clienteNome: string | null;
  commentCount: number;
  attachCount: number;
  tick: number;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.tarefa.id,
    data: { status: props.tarefa.status },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TarefaCard {...props} dragHandle={listeners ?? {}} />
    </div>
  );
}

function DroppableColumn({
  status,
  items,
  children,
}: {
  status: string;
  items: TarefaRow[];
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}`, data: { status } });
  return (
    <div
      ref={setNodeRef}
      className="rounded-[12px] p-3 flex flex-col min-h-[280px]"
      style={{ background: isOver ? "#F7F0E0" : C.beigeLight, transition: "background 120ms" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.textMid }}>
          {status}
        </span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "#fff", color: C.textMid }}
        >
          {items.length}
        </span>
      </div>
      <div className="space-y-2 flex-1">
        {items.length === 0 && (
          <div className="text-xs italic text-center py-6" style={{ color: C.textMuted }}>
            Solte um card aqui
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ================================================================
 * Painel de detalhes do card (Detalhes / Comentários / Anexos)
 * ================================================================ */
function ComentariosTab({ tarefaId }: { tarefaId: string }) {
  const [comentarios, setComentarios] = useState<ComentarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tarefa_comentarios")
      .select("*, autor:profiles(nome)")
      .eq("tarefa_id", tarefaId)
      .order("created_at", { ascending: true });
    if (!error) setComentarios((data ?? []) as unknown as ComentarioRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void carregar();
    const channel = supabase
      .channel(`realtime-comentarios-${tarefaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tarefa_comentarios",
          filter: `tarefa_id=eq.${tarefaId}`,
        },
        () => {
          void carregar();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarefaId]);

  const enviar = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("tarefa_comentarios").insert({
      tarefa_id: tarefaId,
      autor_id: userData.user?.id ?? null,
      conteudo: texto.trim(),
    });
    setEnviando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTexto("");
    void carregar();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-[260px] overflow-y-auto space-y-3 pr-1">
        {loading && (
          <div className="text-sm" style={{ color: C.textMid }}>
            Carregando comentários...
          </div>
        )}
        {!loading && comentarios.length === 0 && (
          <div className="text-sm italic" style={{ color: C.textMuted }}>
            Nenhum comentário ainda.
          </div>
        )}
        {comentarios.map((c) => (
          <div key={c.id} className="rounded-[10px] p-3" style={{ background: C.beigeLight }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: C.dark }}>
                {c.autor?.nome ?? "Usuário"}
              </span>
              <span className="text-[10px]" style={{ color: C.textMuted }}>
                {fmtDateTimeBR(c.created_at)}
              </span>
            </div>
            <div className="text-sm mt-1 whitespace-pre-wrap">{c.conteudo}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea
          rows={2}
          placeholder="Escreva um comentário..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void enviar();
            }
          }}
        />
        <Button
          type="button"
          onClick={enviar}
          disabled={enviando || !texto.trim()}
          className="self-end min-h-11"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function AnexosTab({ tarefaId }: { tarefaId: string }) {
  const [arquivos, setArquivos] = useState<AnexoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("arquivos")
      .select("id, nome_original, nome_storage, bucket, url_publica, tamanho_bytes, created_at")
      .eq("tarefa_id", tarefaId)
      .order("created_at", { ascending: false });
    if (!error) setArquivos((data ?? []) as AnexoRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarefaId]);

  const apagar = async (a: AnexoRow) => {
    if (!confirm(`Remover "${a.nome_original}"?`)) return;
    await supabase.storage.from(a.bucket).remove([a.nome_storage]);
    await supabase.from("arquivos").delete().eq("id", a.id);
    void carregar();
  };

  return (
    <div className="flex flex-col gap-3">
      <FileUploader
        bucket="geral"
        contexto="tarefa"
        tarefaId={tarefaId}
        label="Arraste um anexo aqui ou clique para selecionar"
        onUploaded={() => void carregar()}
      />
      <div className="space-y-2 max-h-[220px] overflow-y-auto">
        {loading && (
          <div className="text-sm" style={{ color: C.textMid }}>
            Carregando anexos...
          </div>
        )}
        {!loading && arquivos.length === 0 && (
          <div className="text-sm italic" style={{ color: C.textMuted }}>
            Nenhum anexo ainda.
          </div>
        )}
        {arquivos.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-[10px] p-3"
            style={{ background: C.beigeLight }}
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{a.nome_original}</div>
              <div className="text-[11px]" style={{ color: C.textMid }}>
                {fmtBytes(a.tamanho_bytes)} · {fmtDateTimeBR(a.created_at)}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {a.url_publica && (
                <a
                  href={a.url_publica}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2"
                  style={{ color: C.textMid }}
                  aria-label="Baixar"
                >
                  <Download size={16} />
                </a>
              )}
              <button
                type="button"
                onClick={() => apagar(a)}
                className="p-2"
                style={{ color: "#B91C1C" }}
                aria-label="Remover"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetalhesTab({
  tarefa,
  clientes,
  onSaved,
}: {
  tarefa: TarefaRow;
  clientes: ClienteRef[];
  onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState(tarefa.titulo);
  const [clienteId, setClienteId] = useState<string | null>(tarefa.cliente_id);
  const [tipo, setTipo] = useState(tarefa.tipo);
  const [status, setStatus] = useState(tarefa.status);
  const [prioridade, setPrioridade] = useState(tarefa.prioridade);
  const [prazo, setPrazo] = useState(tarefa.prazo ?? "");
  const [descricao, setDescricao] = useState(tarefa.descricao ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitulo(tarefa.titulo);
    setClienteId(tarefa.cliente_id);
    setTipo(tarefa.tipo);
    setStatus(tarefa.status);
    setPrioridade(tarefa.prioridade);
    setPrazo(tarefa.prazo ?? "");
    setDescricao(tarefa.descricao ?? "");
  }, [tarefa]);

  const salvar = async () => {
    if (!titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("tarefas")
      .update({
        titulo: titulo.trim(),
        cliente_id: clienteId,
        tipo,
        status,
        prioridade,
        prazo: prazo || null,
        descricao: descricao || null,
      })
      .eq("id", tarefa.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tarefa atualizada");
    onSaved();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Título</label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Cliente</label>
        <Select value={clienteId ?? ""} onValueChange={(v) => setClienteId(v || null)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Tipo</label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAREFA_TIPOS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAREFA_STATUS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Prioridade</label>
          <Select value={prioridade} onValueChange={setPrioridade}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAREFA_PRIORIDADE.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Prazo</label>
          <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Descrição</label>
        <Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <Button type="button" onClick={salvar} disabled={saving} className="self-end min-h-11">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Salvar alterações
      </Button>
    </div>
  );
}

function TarefaDetailDialog({
  tarefa,
  clientes,
  open,
  onOpenChange,
  tick,
}: {
  tarefa: TarefaRow | null;
  clientes: ClienteRef[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tick: number;
}) {
  if (!tarefa) return null;
  const running = !!tarefa.timer_iniciado_em;
  const clienteNome = clientes.find((c) => c.id === tarefa.cliente_id)?.nome ?? "Sem cliente";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6">{tarefa.titulo}</DialogTitle>
        </DialogHeader>

        <div
          className="rounded-[12px] p-4 mb-2 flex items-center justify-between gap-3"
          style={{ background: C.beigeLight }}
        >
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: C.textMid }}
            >
              {clienteNome}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Clock size={16} style={{ color: running ? "#2E7D32" : C.textMid }} />
              <span className="text-xl font-extrabold" style={{ color: C.dark }}>
                {fmtDuration(liveSeconds(tarefa, tick))}
              </span>
              {running && <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />}
            </div>
          </div>
          {running ? (
            <PillBtn variant="ghost" onClick={() => void pauseTimer(tarefa)}>
              <Pause size={14} className="inline mr-1" /> Pausar
            </PillBtn>
          ) : (
            <PillBtn onClick={() => void startTimer(tarefa)}>
              <Play size={14} className="inline mr-1" /> Iniciar
            </PillBtn>
          )}
        </div>

        <Tabs defaultValue="detalhes">
          <TabsList className="w-full">
            <TabsTrigger value="detalhes" className="flex-1">
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="comentarios" className="flex-1">
              Comentários
            </TabsTrigger>
            <TabsTrigger value="anexos" className="flex-1">
              Anexos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="detalhes" className="pt-3">
            <DetalhesTab tarefa={tarefa} clientes={clientes} onSaved={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="comentarios" className="pt-3">
            <ComentariosTab tarefaId={tarefa.id} />
          </TabsContent>
          <TabsContent value="anexos" className="pt-3">
            <AnexosTab tarefaId={tarefa.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================
 * Página principal — Kanban do Sprint
 * ================================================================ */
export function SprintPage() {
  const { openCreate, openDelete } = useCrud();
  const clientes = useClientes();
  const {
    rows: tarefasRaw,
    loading,
    error,
    refetch,
  } = useSupabaseList<TarefaRow>("tarefas", {
    order: { column: "created_at", ascending: false },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Overrides otimistas para status enquanto o realtime não confirma
  const [override, setOverride] = useState<Record<string, string>>({});
  const tarefas = useMemo(
    () => tarefasRaw.map((t) => ({ ...t, status: override[t.id] ?? t.status })),
    [tarefasRaw, override],
  );

  const [detailId, setDetailId] = useState<string | null>(null);
  const detailTarefa = tarefas.find((t) => t.id === detailId) ?? null;

  // Relógio compartilhado — só roda enquanto existir algum timer ativo
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const anyRunning = tarefas.some((t) => t.timer_iniciado_em);
    if (!anyRunning) return;
    const iv = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(iv);
  }, [tarefas]);

  const tarefaIds = useMemo(() => tarefas.map((t) => t.id), [tarefas]);
  const commentCounts = useCounts("tarefa_comentarios", tarefaIds);
  const attachCounts = useCounts("arquivos", tarefaIds);

  const clienteNomeById = useMemo(() => {
    const map = new Map<string, string>();
    clientes.forEach((c) => map.set(c.id, c.nome));
    return map;
  }, [clientes]);

  const emAndamento = tarefas.filter((t) => t.timer_iniciado_em).length;
  const atrasadas = tarefas.filter(
    (t) => t.prazo && t.prazo < new Date().toISOString().slice(0, 10) && t.status !== "Agendado",
  ).length;
  const tempoTotalHoje = tarefas.reduce((s, t) => s + liveSeconds(t, tick), 0);

  const columns = TAREFA_STATUS.map((status) => ({
    status,
    items: tarefas.filter((t) => t.status === status),
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
    if (!TAREFA_STATUS.includes(to)) return;

    setOverride((prev) => ({ ...prev, [activeId]: to! }));
    try {
      const { error } = await supabase.from("tarefas").update({ status: to }).eq("id", activeId);
      if (error) throw error;
      toast.success(`Movido para "${to}"`);
    } catch (err) {
      setOverride((prev) => {
        const n = { ...prev };
        delete n[activeId];
        return n;
      });
      const msg = err instanceof Error ? err.message : "Falha ao mover";
      toast.error(msg);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Calendário"
        title="Sprint"
        accent="produção"
        actions={
          <PillBtn onClick={() => openCreate("tarefa")}>
            <Plus size={14} className="inline mr-1" /> Nova tarefa
          </PillBtn>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-6">
        <MetricCard variant="hero" value={tarefas.length} label="Tarefas no sprint" />
        <MetricCard value={emAndamento} label="Timers ativos" />
        <MetricCard
          variant="accent"
          value={fmtDuration(tempoTotalHoje)}
          label="Tempo total registrado"
        />
        <MetricCard value={atrasadas} label="Com prazo vencido" />
      </div>

      <Card className="mb-6">
        <h3 className="font-extrabold text-lg mb-4">Sprint · arraste os cards entre as colunas</h3>
        <ListState
          loading={loading}
          error={error}
          rows={tarefas}
          onRetry={refetch}
          skeletonVariant="row"
          skeletonCount={3}
          emptyTitle="Nenhuma tarefa ainda"
          emptyDescription="Crie a primeira tarefa para começar a organizar o sprint."
          actionLabel="Nova tarefa"
          onAction={() => openCreate("tarefa")}
        >
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
              {columns.map((col) => (
                <SortableContext
                  key={col.status}
                  items={col.items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn status={col.status} items={col.items}>
                    {col.items.map((t) => (
                      <SortableTarefa
                        key={t.id}
                        tarefa={t}
                        clienteNome={
                          t.cliente_id ? (clienteNomeById.get(t.cliente_id) ?? null) : null
                        }
                        commentCount={commentCounts[t.id] ?? 0}
                        attachCount={attachCounts[t.id] ?? 0}
                        tick={tick}
                        onOpen={() => setDetailId(t.id)}
                        onDelete={() => openDelete("tarefa", t)}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              ))}
            </div>
          </DndContext>
        </ListState>
      </Card>

      <TarefaDetailDialog
        tarefa={detailTarefa}
        clientes={clientes}
        open={!!detailTarefa}
        onOpenChange={(v) => !v && setDetailId(null)}
        tick={tick}
      />
    </>
  );
}
