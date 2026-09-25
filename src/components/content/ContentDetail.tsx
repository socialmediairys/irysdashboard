import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronDown, Film, ImagePlus, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import {
  ACCEPT, CANAIS, CONTENT_STATUS, CONTENT_STATUS_LABEL, CONTENT_STATUS_VARIANT, FORMATOS, cdb, fmtShort,
  signedUrl, uploadMidias, useContentActions, type Conteudo, type ContentStatus, type Midia,
} from "@/lib/content";
import { cn } from "@/lib/utils";
import { btn, btnGhost, btnPrimary, inputCls } from "@/components/strategy/ui";

type Detail = {
  c: Conteudo; cliente: string; midias: Midia[]; interno: string;
  comentarios: { id: string; texto: string; tipo: string; alvo: string; created_at: string }[];
  eventos: { id: string; tipo: string; de: string | null; para: string | null; detalhe: string | null; created_at: string }[];
  versoes: { id: string; numero: number; status: string; status_arte: string; status_legenda: string; enviada_em: string }[];
  tarefas: { id: string; titulo: string; status: string; prazo: string | null }[];
  estrategia: { pilar?: string; tema?: string; mensagem?: string; argumento?: string; prova?: string | null; evidencia?: string };
};

async function loadDetail(id: string): Promise<Detail> {
  const { data: c, error } = await cdb("conteudos").select("*").eq("id", id).single();
  if (error) throw error;
  const one = (t: string, cid: string | null, sel: string) => (cid ? cdb(t).select(sel).eq("id", cid).maybeSingle() : Promise.resolve({ data: null }));
  const [cli, mid, int, com, ev, ve, pi, te, me, ar, evi, ta] = await Promise.all([
    supabase.from("clientes").select("nome").eq("id", c.cliente_id).maybeSingle(),
    cdb("conteudo_midias").select("*").eq("conteudo_id", id).order("ordem"),
    cdb("conteudos_internos").select("observacoes").eq("conteudo_id", id).maybeSingle(),
    cdb("conteudo_comentarios").select("id,texto,tipo,alvo,created_at").eq("conteudo_id", id).order("created_at"),
    cdb("conteudo_eventos").select("id,tipo,de,para,detalhe,created_at").eq("conteudo_id", id).order("created_at", { ascending: false }).limit(50),
    cdb("conteudo_versoes").select("id,numero,status,status_arte,status_legenda,enviada_em").eq("conteudo_id", id).order("numero"),
    one("editorial_pilares", c.pilar_id, "nome"), one("editorial_temas", c.tema_id, "nome"),
    one("editorial_mensagens", c.mensagem_id, "mensagem"), one("editorial_argumentos", c.argumento_id, "argumento,prova"),
    one("estrategia_evidencias", c.evidencia_id, "informacao"),
    cdb("tarefas").select("id,titulo,status,prazo").eq("conteudo_id", id).order("created_at"),
  ]);
  const midias = await Promise.all(((mid.data ?? []) as Midia[]).map(async (m) => ({ ...m, url: await signedUrl(m.bucket, m.storage_path) })));
  return {
    c, cliente: cli.data?.nome ?? "—", midias, interno: int.data?.observacoes ?? "",
    tarefas: ta.data ?? [], comentarios: com.data ?? [], eventos: ev.data ?? [], versoes: ve.data ?? [],
    estrategia: { pilar: pi.data?.nome, tema: te.data?.nome, mensagem: me.data?.mensagem, argumento: ar.data?.argumento, prova: ar.data?.prova, evidencia: evi.data?.informacao },
  };
}

export function ContentDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl">
        {id ? <DetailBody id={id} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailBody({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["conteudo", id], queryFn: () => loadDetail(id) });
  const a = useContentActions();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const reload = () => qc.invalidateQueries({ queryKey: ["conteudo", id] });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>;
  if (error || !data) return <div className="p-6 text-sm text-destructive">Não foi possível abrir o conteúdo.</div>;
  const { c } = data;
  const save = async (patch: Partial<Conteudo>) => { if (await a.update(c.id, patch)) reload(); };
  const sent = data.versoes.some((v) => v.numero === c.versao_atual);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    await uploadMidias(c.id, c.cliente_id, [...files], data.midias.length);
    setUploading(false); reload(); a.refresh();
  };
  const move = async (i: number, dir: -1 | 1) => {
    const arr = [...data.midias]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    await Promise.all(arr.map((m, k) => cdb("conteudo_midias").update({ ordem: k }).eq("id", m.id)));
    reload();
  };
  const delMidia = async (m: Midia) => {
    const { error } = await cdb("conteudo_midias").delete().eq("id", m.id);
    if (error) return toast.error("Não foi possível remover.");
    // Arquivo só é apagado do armazenamento se nenhuma versão enviada o referencia.
    if (!sent && !data.versoes.length) await supabase.storage.from(m.bucket).remove([m.storage_path]);
    reload(); a.refresh();
  };
  const saveInterno = async (v: string) => {
    const { error } = await cdb("conteudos_internos").upsert({ conteudo_id: c.id, observacoes: v });
    if (error) toast.error("Não foi possível salvar a observação."); else reload();
  };

  return (
    <div>
      <SheetHeader className="space-y-3 border-b border-border px-6 py-5 text-left">
        <div className="flex items-center gap-2 pr-8 text-[13px] text-muted-foreground">
          <span>{data.cliente}</span><span>·</span><span>{fmtShort(c.data_prevista)}{c.horario ? ` ${c.horario.slice(0, 5)}` : ""}</span>
          <span>·</span><span>{[c.canal, c.formato].filter(Boolean).join(" / ") || "Sem canal"}</span>
          <span className="ml-auto">V{c.versao_atual}</span>
        </div>
        <SheetTitle className="sr-only">{c.titulo || "Conteúdo"}</SheetTitle>
        <SheetDescription className="sr-only">Detalhe do conteúdo</SheetDescription>
        <input defaultValue={c.titulo} key={`t-${c.updated_at}`} onBlur={(e) => e.target.value !== c.titulo && save({ titulo: e.target.value })}
          placeholder="Título interno" className="w-full bg-transparent text-xl font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none" />
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant={CONTENT_STATUS_VARIANT[c.status]}>{CONTENT_STATUS_LABEL[c.status]}</StatusBadge>
          <select value={c.status} onChange={(e) => save({ status: e.target.value as ContentStatus })} className={cn(inputCls, "h-8 w-auto py-1 text-[13px]")} aria-label="Status">
            {CONTENT_STATUS.map((s) => <option key={s} value={s}>{CONTENT_STATUS_LABEL[s]}</option>)}
          </select>
          <input type="date" defaultValue={c.data_prevista ?? ""} key={`d-${c.updated_at}`} onBlur={(e) => save({ data_prevista: e.target.value || null })} className={cn(inputCls, "h-8 w-auto py-1 text-[13px]")} aria-label="Data" />
          <input type="time" defaultValue={c.horario?.slice(0, 5) ?? ""} key={`h-${c.updated_at}`} onBlur={(e) => save({ horario: e.target.value || null })} className={cn(inputCls, "h-8 w-auto py-1 text-[13px]")} aria-label="Horário" />
          <select value={c.canal ?? ""} onChange={(e) => save({ canal: e.target.value || null })} className={cn(inputCls, "h-8 w-auto py-1 text-[13px]")} aria-label="Canal">
            <option value="">Canal</option>{CANAIS.map((x) => <option key={x}>{x}</option>)}
          </select>
          <select value={c.formato ?? ""} onChange={(e) => save({ formato: e.target.value || null })} className={cn(inputCls, "h-8 w-auto py-1 text-[13px]")} aria-label="Formato">
            <option value="">Formato</option>{FORMATOS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
      </SheetHeader>

      <SendBar c={c} sent={sent} onSend={() => save({ status: "com_cliente" })} />

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr_1fr]">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Mídia</h3>
            <button className={btn} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} strokeWidth={1.6} />} Enviar
            </button>
            <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
          </div>
          {data.midias.length ? (
            <div className="space-y-2">
              <MediaView m={data.midias[0]} large />
              {data.midias.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {data.midias.map((m, i) => (
                    <div key={m.id} className="group relative">
                      <MediaView m={m} />
                      <span className="absolute left-1 top-1 rounded bg-background/90 px-1 text-[11px] text-foreground">{i + 1}</span>
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/90 p-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        <button onClick={() => move(i, -1)} aria-label="Mover para a esquerda" className="p-1 text-muted-foreground hover:text-foreground"><ArrowLeft size={12} /></button>
                        <button onClick={() => delMidia(m)} aria-label="Remover" className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                        <button onClick={() => move(i, 1)} aria-label="Mover para a direita" className="p-1 text-muted-foreground hover:text-foreground"><ArrowRight size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {data.midias.length === 1 && <button className={btnGhost} onClick={() => delMidia(data.midias[0])}><Trash2 size={13} /> Remover mídia</button>}
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-[13px] text-muted-foreground hover:bg-accent/50">
              <ImagePlus size={20} strokeWidth={1.4} /> JPG, PNG, WEBP ou MP4 · várias imagens formam um carrossel
            </button>
          )}
        </section>

        <section className="space-y-3">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Legenda</h3>
              {sent && <span className="text-[12px] text-muted-foreground">V{c.versao_atual} enviada — editar cria V{c.versao_atual + 1}</span>}
            </div>
            <textarea defaultValue={c.legenda ?? ""} key={`l-${c.updated_at}`} rows={12} onBlur={(e) => e.target.value !== (c.legenda ?? "") && save({ legenda: e.target.value })}
              placeholder="Escreva a legenda…" className={cn(inputCls, "resize-y leading-relaxed")} />
          </div>
          <input defaultValue={c.hashtags ?? ""} key={`ht-${c.updated_at}`} onBlur={(e) => e.target.value !== (c.hashtags ?? "") && save({ hashtags: e.target.value || null })} placeholder="Hashtags (opcional)" className={inputCls} />
        </section>
      </div>

      <div className="divide-y divide-border border-t border-border">
        <Fold title="Estratégia relacionada" defaultOpen={!!c.pilar_id}>
          {c.pilar_id || c.mensagem_id || c.objetivo || c.cta ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Fact k="Pilar → tema" v={[data.estrategia.pilar, data.estrategia.tema].filter(Boolean).join(" → ")} />
              <Fact k="Jornada" v={c.jornada} />
              <Fact k="Mensagem" v={data.estrategia.mensagem} wide />
              <Fact k="Argumento" v={data.estrategia.argumento} />
              <Fact k="Prova" v={data.estrategia.prova ?? data.estrategia.evidencia} />
              <Fact k="Objetivo" v={c.objetivo} />
              <Fact k="CTA" v={c.cta} />
            </dl>
          ) : <p className="text-[13px] text-muted-foreground">Conteúdo avulso — sem vínculo com o Sistema Editorial.</p>}
          {c.origem === "calendario_estrategico" && <p className="mt-3 text-[12px] text-muted-foreground">Originado do Calendário Estratégico.</p>}
        </Fold>
        <Fold title={`Tarefas relacionadas${data.tarefas.length ? ` (${data.tarefas.length})` : ""}`}>
          <RelatedTasks c={c} items={data.tarefas} onDone={reload} />
        </Fold>
        <Fold title="Publicação">
          <div className="grid gap-2 sm:grid-cols-2">
            <input defaultValue={c.publicacao_url ?? ""} onBlur={(e) => save({ publicacao_url: e.target.value || null })} placeholder="Link da publicação" className={inputCls} />
            <input defaultValue={c.plataforma_post_id ?? ""} onBlur={(e) => save({ plataforma_post_id: e.target.value || null })} placeholder="ID do post na plataforma" className={inputCls} />
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">{c.publicado_em ? `Publicado em ${new Date(c.publicado_em).toLocaleString("pt-BR")}` : "Agendado e Publicado são marcados manualmente; não há publicação automática."}</p>
        </Fold>
        <Fold title="Observações e comentários" defaultOpen={data.comentarios.some((x) => x.tipo === "cliente")}>
          <textarea defaultValue={data.interno} rows={3} onBlur={(e) => e.target.value !== data.interno && saveInterno(e.target.value)} placeholder="Visível apenas para a equipe" className={inputCls} />
          <Comments conteudoId={c.id} clienteId={c.cliente_id} items={data.comentarios} onDone={reload} />
        </Fold>
        <Fold title="Versões e histórico">
          {data.versoes.length > 0 && (
            <ul className="mb-4 space-y-1 text-[13px]">
              {data.versoes.map((v) => (
                <li key={v.id} className="flex gap-3"><span className="w-8 font-medium text-foreground">V{v.numero}</span><span className="text-muted-foreground">Enviada {new Date(v.enviada_em).toLocaleDateString("pt-BR")} · Arte: {v.status_arte} · Legenda: {v.status_legenda}</span></li>
              ))}
            </ul>
          )}
          <ul className="space-y-1 text-[13px] text-muted-foreground">
            {data.eventos.map((e) => (
              <li key={e.id} className="flex gap-3">
                <span className="w-28 shrink-0">{new Date(e.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span>{e.tipo === "criado" ? `Criado em ${label(e.para)}` : e.tipo === "status" ? `${label(e.de)} → ${label(e.para)}` : e.tipo === "nova_versao" ? `Nova versão ${e.detalhe}` : e.tipo === "avaliacao_cliente" ? `Cliente: ${e.detalhe?.replace("alteracao_solicitada", "alteração solicitada")}` : e.tipo}</span>
              </li>
            ))}
          </ul>
        </Fold>
      </div>

      <div className="flex justify-between border-t border-border px-6 py-4">
        <button className={cn(btnGhost, "hover:text-destructive")} onClick={async () => { if (confirm("Excluir este conteúdo?") && (await a.remove(c.id))) onClose(); }}><Trash2 size={13} /> Excluir</button>
        <button className={btnPrimary} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

const PART: Record<string, string> = { pendente: "Pendente", aprovado: "Aprovada", alteracao_solicitada: "Alteração solicitada" };
const partCls = (s: string) => (s === "aprovado" ? "text-success" : s === "alteracao_solicitada" ? "text-destructive" : "text-muted-foreground");

function SendBar({ c, sent, onSend }: { c: Conteudo; sent: boolean; onSend: () => void }) {
  const waiting = ["com_cliente", "alteracao_solicitada", "aprovado", "agendado", "publicado"].includes(c.status);
  const canSend = ["em_producao", "revisao_interna", "alteracao_solicitada", "planejado"].includes(c.status);
  const resend = c.status === "alteracao_solicitada";
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-muted/30 px-6 py-3 text-[13px]">
      {waiting || sent ? (
        <>
          <span className="text-muted-foreground">Cliente · V{c.versao_atual}{sent ? "" : " (rascunho)"}</span>
          <span>Arte: <span className={partCls(c.status_arte)}>{PART[c.status_arte]}</span></span>
          <span>Legenda: <span className={partCls(c.status_legenda)}>{PART[c.status_legenda]}</span></span>
          {c.enviado_cliente_em && <span className="text-muted-foreground">Enviado {new Date(c.enviado_cliente_em).toLocaleDateString("pt-BR")}</span>}
        </>
      ) : <span className="text-muted-foreground">Ainda não enviado ao cliente.</span>}
      {canSend && (
        <button className={cn(btnPrimary, "ml-auto")} onClick={() => { if (confirm(resend ? `Enviar nova versão (V${sent ? c.versao_atual + 1 : c.versao_atual}) ao cliente? A versão anterior fica preservada.` : "Enviar ao cliente para aprovação? Legenda e mídias desta versão ficam congeladas.")) onSend(); }}>
          <Send size={13} /> {resend ? "Reenviar nova versão" : "Enviar ao cliente"}
        </button>
      )}
    </div>
  );
}

function RelatedTasks({ c, items, onDone }: { c: Conteudo; items: Detail["tarefas"]; onDone: () => void }) {
  const [t, setT] = useState("");
  const add = async () => {
    if (!t.trim()) return;
    const { error } = await cdb("tarefas").insert({ titulo: t.trim(), cliente_id: c.cliente_id, conteudo_id: c.id, status: "not_started" });
    if (error) return toast.error("Não foi possível criar a tarefa.");
    setT(""); onDone();
  };
  return (
    <div className="space-y-2">
      {items.length ? (
        <ul className="divide-y divide-border rounded-md border border-border">
          {items.map((x) => (
            <li key={x.id}>
              <Link to="/admin/sprints" search={{ task: x.id }} className="flex items-center gap-3 px-3 py-2 text-[13px] hover:bg-accent/50">
                <span className="min-w-0 flex-1 truncate text-foreground">{x.titulo}</span>
                <span className="text-muted-foreground">{x.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="text-[13px] text-muted-foreground">Nenhuma tarefa vinculada. Tarefas são opcionais.</p>}
      <div className="flex gap-2">
        <input value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nova tarefa para este conteúdo…" className={inputCls} />
        <button className={btn} onClick={add}><Plus size={13} /> Criar</button>
      </div>
    </div>
  );
}

const label = (s: string | null) => (s ? CONTENT_STATUS_LABEL[s as ContentStatus] ?? s : "—");

function MediaView({ m, large }: { m: Midia; large?: boolean }) {
  const cls = cn("w-full rounded-md border border-border bg-muted object-cover", large ? "aspect-[4/5] max-h-[520px]" : "aspect-square");
  if (!m.url) return <div className={cls} />;
  return m.tipo === "video"
    ? (large ? <video src={m.url} controls className={cls} /> : <div className={cn(cls, "flex items-center justify-center")}><Film size={16} className="text-muted-foreground" /></div>)
    : <img src={m.url} alt={m.nome_original ?? "Mídia"} className={cls} loading="lazy" />;
}

function Fold({ title, children, defaultOpen }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-6 py-3.5 text-left text-sm font-medium text-foreground hover:bg-accent/40">
        {title}<ChevronDown size={15} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-6 pb-5">{children}</div>}
    </div>
  );
}

function Fact({ k, v, wide }: { k: string; v?: string | null; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><dt className="text-[12px] text-muted-foreground">{k}</dt><dd className="text-foreground">{v || "—"}</dd></div>;
}

function Comments({ conteudoId, clienteId, items, onDone }: { conteudoId: string; clienteId: string; items: Detail["comentarios"]; onDone: () => void }) {
  const [t, setT] = useState("");
  const [paraCliente, setParaCliente] = useState(false);
  useEffect(() => setT(""), [conteudoId]);
  const add = async () => {
    if (!t.trim()) return;
    const { error } = await cdb("conteudo_comentarios").insert({ conteudo_id: conteudoId, cliente_id: clienteId, tipo: paraCliente ? "cliente" : "interno", texto: t.trim() });
    if (error) return toast.error("Não foi possível comentar.");
    setT(""); onDone();
  };
  return (
    <div className="mt-4">
      <div className="mb-2 text-[12px] text-muted-foreground">Comentários — “Interno” nunca aparece para o cliente</div>
      <ul className="mb-2 space-y-2">
        {items.map((c) => (
          <li key={c.id} className="rounded-md bg-muted/50 px-3 py-2 text-[13px] text-foreground">
            <span className="mr-2 text-[11px] text-muted-foreground">{c.tipo === "cliente" ? "Visível ao cliente" : "Interno"}{c.alvo !== "geral" ? ` · ${c.alvo}` : ""} · {new Date(c.created_at).toLocaleDateString("pt-BR")}</span>{c.texto}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <select value={paraCliente ? "c" : "i"} onChange={(e) => setParaCliente(e.target.value === "c")} className={cn(inputCls, "w-36")} aria-label="Visibilidade"><option value="i">Interno</option><option value="c">Para o cliente</option></select>
        <input value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={paraCliente ? "Resposta visível ao cliente…" : "Comentário interno…"} className={inputCls} />
        <button className={btn} onClick={add}>Enviar</button>
      </div>
    </div>
  );
}
