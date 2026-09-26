import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Paperclip, Send, X, FileText, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDelete } from "@/components/crud/ConfirmDelete";
import { TASK_BUCKET, type Member } from "@/lib/tasks";

type Attachment = { path: string; name: string; type: string; size: number };
type Comment = {
  id: string; content: string; created_at: string; edited_at: string | null;
  author_id: string | null; parent_id: string | null;
  attachments: Attachment[]; mentions: string[];
  author?: { nome: string | null } | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tc = () => supabase.from("task_comments" as any) as any;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
/** Texto → HTML seguro: links clicáveis, **negrito**, _itálico_, @menções. */
function renderBody(text: string, members: Member[]) {
  let h = esc(text);
  h = h.replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
  h = h.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, "$1<em>$2</em>");
  const names = members.map((m) => m.nome).filter(Boolean).sort((a, b) => b.length - a.length);
  for (const n of names) {
    const e = esc(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    h = h.replace(new RegExp(`@${e}`, "g"), `<span class="mention">@${esc(n)}</span>`);
  }
  return h.replace(/\n/g, "<br>");
}

function fmtWhen(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} · ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function Attachments({ items }: { items: Attachment[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!items.length) return;
    supabase.storage.from(TASK_BUCKET).createSignedUrls(items.map((i) => i.path), 3600).then(({ data }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((d) => { if (d.path && d.signedUrl) m[d.path] = d.signedUrl; });
      setUrls(m);
    });
  }, [items]);
  if (!items.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((a) => a.type.startsWith("image/") ? (
        <a key={a.path} href={urls[a.path]} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-border">
          {urls[a.path] ? <img src={urls[a.path]} alt={a.name} className="h-24 max-w-[180px] object-cover" /> : <div className="h-24 w-32 bg-muted" />}
        </a>
      ) : (
        <a key={a.path} href={urls[a.path]} target="_blank" rel="noopener noreferrer"
          className="inline-flex max-w-[240px] items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[12px] text-foreground hover:bg-muted">
          <FileText size={13} className="shrink-0 text-muted-foreground" /><span className="truncate">{a.name}</span>
        </a>
      ))}
    </div>
  );
}

function Composer({ taskId, members, parentId, initial, onDone, onCancel, compact }: {
  taskId: string; members: Member[]; parentId?: string | null;
  initial?: Comment; onDone: () => void; onCancel?: () => void; compact?: boolean;
}) {
  const [text, setText] = useState(initial?.content ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [mentionQ, setMentionQ] = useState<string | null>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onText = (v: string) => {
    setText(v);
    const pos = ta.current?.selectionStart ?? v.length;
    const m = v.slice(0, pos).match(/(?:^|\s)@([\p{L}\d ]{0,24})$/u);
    setMentionQ(m ? m[1] : null);
  };
  const suggestions = mentionQ === null ? [] : members.filter((m) => m.nome.toLowerCase().startsWith(mentionQ.toLowerCase().trimStart())).slice(0, 6);
  const pick = (m: Member) => {
    const pos = ta.current?.selectionStart ?? text.length;
    const before = text.slice(0, pos).replace(/@([\p{L}\d ]{0,24})$/u, `@${m.nome} `);
    setText(before + text.slice(pos));
    setMentionQ(null);
    ta.current?.focus();
  };

  const send = async () => {
    if (!text.trim() && !files.length) return;
    setSending(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      const uploaded: Attachment[] = [...(initial?.attachments ?? [])];
      if (files.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: prof } = await (supabase.from("profiles") as any).select("org_id").eq("id", uid).single();
        for (const f of files) {
          const path = `${prof?.org_id}/${taskId}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_")}`;
          const { error } = await supabase.storage.from(TASK_BUCKET).upload(path, f, { contentType: f.type });
          if (error) throw new Error(`Não foi possível anexar ${f.name}.`);
          uploaded.push({ path, name: f.name, type: f.type || "application/octet-stream", size: f.size });
        }
      }
      const mentions = members.filter((m) => text.includes(`@${m.nome}`)).map((m) => m.id);
      if (initial) {
        const { error } = await tc().update({ content: text.trim(), mentions, attachments: uploaded, edited_at: new Date().toISOString() }).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await tc().insert({ task_id: taskId, author_id: uid, content: text.trim(), mentions, attachments: uploaded, parent_id: parentId ?? null });
        if (error) throw error;
      }
      setText(""); setFiles([]); onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o comentário.");
    } finally { setSending(false); }
  };

  return (
    <div className="relative">
      <Textarea
        ref={ta}
        rows={compact ? 2 : 3}
        value={text}
        onChange={(e) => onText(e.target.value)}
        placeholder={parentId ? "Responder…" : "Escreva um comentário… use @ para mencionar"}
        onKeyDown={(e) => {
          if (suggestions.length && e.key === "Enter") { e.preventDefault(); pick(suggestions[0]); return; }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void send(); }
          if (e.key === "Escape") setMentionQ(null);
        }}
      />
      {suggestions.length > 0 && (
        <div className="absolute left-2 top-full z-20 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-sm">
          {suggestions.map((m) => (
            <button key={m.id} type="button" onMouseDown={(e) => { e.preventDefault(); pick(m); }}
              className="block w-full rounded px-2 py-1 text-left text-[13px] hover:bg-muted">{m.nome}</button>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[12px]">
              {f.name}
              <button type="button" aria-label={`Remover ${f.name}`} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" multiple className="hidden" aria-label="Anexar arquivos"
            onChange={(e) => { setFiles((p) => [...p, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }} />
          <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="h-8 gap-1 text-muted-foreground">
            <Paperclip size={14} /> Anexar
          </Button>
          {!compact && <span className="hidden text-[11px] text-muted-foreground sm:inline">**negrito** · _itálico_ · Ctrl+Enter envia</span>}
        </div>
        <div className="flex gap-2">
          {onCancel && <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-8">Cancelar</Button>}
          <Button type="button" size="sm" onClick={send} disabled={sending || (!text.trim() && !files.length)} className="h-8 gap-1">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {initial ? "Salvar" : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TaskComments({ taskId, members, onCount }: { taskId: string; members: Member[]; onCount?: () => void }) {
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [replying, setReplying] = useState<string | null>(null);
  const [del, setDel] = useState<Comment | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await tc()
      .select("id,content,created_at,edited_at,author_id,parent_id,attachments,mentions,author:profiles(nome)")
      .eq("task_id", taskId).order("created_at", { ascending: true });
    setLoading(false);
    if (error) return toast.error("Não foi possível carregar os comentários.");
    setItems((data ?? []) as Comment[]);
  }, [taskId]);
  useEffect(() => { void load(); supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, [load]);

  const done = () => { setEditing(null); setReplying(null); void load(); onCount?.(); };
  const roots = useMemo(() => items.filter((c) => !c.parent_id), [items]);
  const replies = (id: string) => items.filter((c) => c.parent_id === id);

  const remove = async () => {
    if (!del) return;
    const { error } = await tc().delete().eq("id", del.id);
    if (error) toast.error("Não foi possível excluir.");
    else if (del.attachments?.length) await supabase.storage.from(TASK_BUCKET).remove(del.attachments.map((a) => a.path));
    setDel(null); done();
  };

  const One = ({ c, child }: { c: Comment; child?: boolean }) => (
    <div className={child ? "ml-6 border-l border-border pl-3" : ""}>
      <div className="flex items-baseline gap-2">
        <span className="text-[13px] font-medium text-foreground">{c.author?.nome ?? "Usuário"}</span>
        <span className="text-[11px] text-muted-foreground">{fmtWhen(c.created_at)}{c.edited_at ? " · editado" : ""}</span>
      </div>
      {editing === c.id ? (
        <div className="mt-1"><Composer taskId={taskId} members={members} initial={c} onDone={done} onCancel={() => setEditing(null)} compact /></div>
      ) : (
        <>
          {c.content && <div className="comment-body mt-0.5 text-[14px] leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: renderBody(c.content, members) }} />}
          <Attachments items={c.attachments ?? []} />
          <div className="mt-1 flex gap-3 text-[12px] text-muted-foreground">
            {!child && <button type="button" className="hover:text-foreground" onClick={() => setReplying(c.id)}>Responder</button>}
            {c.author_id === me && <button type="button" className="hover:text-foreground" onClick={() => setEditing(c.id)}>Editar</button>}
            {c.author_id === me && <button type="button" className="hover:text-destructive" onClick={() => setDel(c)}>Excluir</button>}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {loading ? <div className="text-[13px] text-muted-foreground">Carregando…</div>
        : roots.length === 0 ? <div className="text-[13px] text-muted-foreground">Nenhum comentário ainda.</div>
        : roots.map((c) => (
          <div key={c.id} className="space-y-3">
            <One c={c} />
            {replies(c.id).map((r) => <One key={r.id} c={r} child />)}
            {replying === c.id && (
              <div className="ml-6 flex gap-2"><CornerDownRight size={14} className="mt-2 shrink-0 text-muted-foreground" />
                <div className="flex-1"><Composer taskId={taskId} members={members} parentId={c.id} onDone={done} onCancel={() => setReplying(null)} compact /></div>
              </div>
            )}
          </div>
        ))}
      <Composer taskId={taskId} members={members} onDone={done} />
      <ConfirmDelete open={!!del} onOpenChange={(v) => !v && setDel(null)} onConfirm={remove} title="Excluir comentário?" />
    </div>
  );
}
