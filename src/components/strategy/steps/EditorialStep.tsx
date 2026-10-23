import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { JORNADA_OPCOES } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { Empty, btn, btnGhost, inputCls } from "../ui";
import { useStrategyActions, type Mensagem } from "../useStrategy";
import { MethodArtifacts } from "./MethodArtifacts";
import { StrategyContext } from "../StrategyContext";

const FORMATOS = ["Reels", "Carrossel", "Story", "Post", "Vídeo", "Live"];

/** Pilar → Tema → Mensagem → Argumento/Prova. Estrutura consumida pelo Calendário e, na Fase 5, pelo Conteúdo. */
export function EditorialStep({ data, clienteId, touch }: StepProps) {
  const a = useStrategyActions(clienteId);
  const [pilarSel, setPilarSel] = useState<string | null>(data.pilares[0]?.id ?? null);
  const [novoPilar, setNovoPilar] = useState("");
  const [temaAberto, setTemaAberto] = useState<string | null>(null);
  const legado = Array.isArray(data.legado?.pilares) ? (data.legado!.pilares as string[]) : [];
  const pilar = data.pilares.find((p) => p.id === pilarSel) ?? data.pilares[0];
  const temas = data.temas.filter((t) => t.pilar_id === pilar?.id);

  const addPilar = async (nome: string) => { if (!nome.trim()) return; await a.insert("editorial_pilares", { nome: nome.trim(), ordem: data.pilares.length }); setNovoPilar(""); touch(); };

  return (
    <div className="space-y-8">
      <StrategyContext data={data} etapa={12} />
      <MethodArtifacts etapa={12} data={data} clienteId={clienteId} substeps={[
        { key: "inventario", prompt: "Prompt 37 (arquivos 38–40 repetem)", title: "Inventário", question: "O que já foi aprovado na estratégia e precisa encontrar lugar no sistema editorial?", fields: [
          { key: "e12_inventario", label: "Inventário editorial estratégico", hint: "Tese, argumentos, mensagens, objeções, provas e limites + função, prioridade e jornada.", rows: 8 },
        ]},
        { key: "temas", prompt: "Prompt 37 (arquivos 38–40 repetem)", title: "Temas editoriais", question: "Quais grandes temas organizam a comunicação e qual função estratégica cada um cumpre?", fields: [
          { key: "e12_temas", label: "Proposta de temas", hint: "Tema | o que reúne | argumento principal | crença enfrentada | função estratégica.", rows: 8 },
        ]},
        { key: "priorizacao", prompt: "Prompt 37 (arquivos 38–40 repetem)", title: "Priorização", question: "Quais temas merecem mais presença no ciclo?", fields: [
          { key: "e12_priorizacao", label: "Priorização editorial", hint: "Pontue Posicionamento, Gargalo, Decisão, Provas e Recorrência (0–2) e classifique a prioridade.", rows: 7 },
        ]},
        { key: "mensagens_provas", prompt: "Prompt 37 (arquivos 38–40 repetem)", title: "Mensagens e provas", question: "Como mensagens, argumentos e provas se distribuem pelos temas?", fields: [
          { key: "e12_mensagem_tema", label: "Mapa Mensagem → Tema", hint: "Mensagem | tipo | tema principal/secundário | argumento | prova | jornada.", rows: 7 },
          { key: "e12_provas", label: "Banco de provas por tema", hint: "Quais provas existem e quais ainda precisam ser produzidas?", rows: 5 },
        ]},
        { key: "lacunas", prompt: "Prompt 37 (arquivos 38–40 repetem)", title: "Lacunas", question: "Onde há redundância, tema sem prova, mensagem sem tema ou função descoberta?", fields: [
          { key: "e12_lacunas", label: "Lacunas e sobreposições", hint: "Problema identificado + correção/produção recomendada.", rows: 7 },
        ]},
        { key: "consolidacao", prompt: "Prompt 41 (arquivo 43 repete)", title: "Consolidação", question: "Qual sistema editorial aprovado seguirá para o calendário?", fields: [
          { key: "e12_consolidado", label: "Sistema editorial consolidado", hint: "Temas aprovados, função, prioridade, mensagens, argumentos, provas, jornada e limites.", rows: 9 },
        ]},
      ]} />
      <section className="space-y-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Grupos editoriais</h3><p className="text-xs text-muted-foreground">Selecione um grupo para trabalhar seus temas.</p></div></div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {data.pilares.map((p) => {
              const count = data.temas.filter((t) => t.pilar_id === p.id).length;
              return <button key={p.id} type="button" onClick={() => { setPilarSel(p.id); setTemaAberto(null); }} aria-pressed={pilar?.id === p.id} className={cn("flex min-h-16 items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors", pilar?.id === p.id ? "border-foreground/50 bg-secondary" : "border-border hover:bg-secondary/60")}><span className="min-w-0 text-[13px] font-medium">{p.nome}</span><span className="shrink-0 text-xs text-muted-foreground">{count} temas</span></button>;
            })}
          </div>
          <div className="mt-3 flex max-w-sm gap-2"><input aria-label="Nome do novo grupo" value={novoPilar} onChange={(e) => setNovoPilar(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void addPilar(novoPilar)} placeholder="Nome do novo grupo" className={`${inputCls} h-9`} /><button className={btn} onClick={() => void addPilar(novoPilar)}><Plus size={14}/> Grupo</button></div>
          {!data.pilares.length && legado.length > 0 && <button className="mt-2 text-xs underline" onClick={async () => { for (const [i,n] of legado.entries()) await a.insert("editorial_pilares", { nome:n, ordem:i }); touch(); }}>Importar grupos anteriores</button>}
        </div>
        {pilar ? <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">{pilar.nome}</h3><p className="text-xs text-muted-foreground">{temas.length} temas · abra somente o que estiver editando.</p></div><div className="flex items-center gap-2"><AddInline label="Tema" onAdd={async (nome) => { await a.insert("editorial_temas", { pilar_id:pilar.id, nome }); touch(); }} /><button className={btnGhost} onClick={() => { if (window.confirm("Excluir este grupo? Confira os temas vinculados antes de continuar.")) void a.remove("editorial_pilares",pilar.id); }} aria-label="Excluir grupo"><Trash2 size={14}/></button></div></div>
          {temas.length ? temas.map((t) => {
            const msgs = data.mensagens.filter((m) => m.tema_id === t.id);
            const aberto = temaAberto === t.id;
            return <div key={t.id} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 px-4 py-3"><button type="button" aria-expanded={aberto} onClick={() => setTemaAberto(aberto ? null : t.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="text-muted-foreground">{aberto ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}</span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{t.nome}</span><span className="text-xs text-muted-foreground">{msgs.length} mensagens · {data.argumentos.filter((x) => msgs.some((m) => m.id === x.mensagem_id)).length} argumentos</span></span></button><button className={btnGhost} onClick={() => { if(window.confirm("Excluir este tema e verificar suas mensagens vinculadas?")) void a.remove("editorial_temas",t.id); }} aria-label={`Excluir tema ${t.nome}`}><Trash2 size={14}/></button></div>
              {aberto && <div className="border-t border-border p-3 sm:p-4"><div className="mb-3 flex items-center justify-between gap-2"><span className="text-[13px] font-medium">Mensagens deste tema</span><AddInline label="Mensagem" onAdd={async (mensagem) => { await a.insert("editorial_mensagens", { tema_id:t.id, mensagem }); touch(); }}/></div>{msgs.length ? <MessageEditorList mensagens={msgs} data={data} clienteId={clienteId}/> : <Empty>Adicione a primeira mensagem deste tema.</Empty>}</div>}
            </div>;
          }) : <Empty>Adicione o primeiro tema deste grupo.</Empty>}
        </div> : <Empty>Crie um grupo editorial para organizar os temas.</Empty>}
      </section>
    </div>
  );
}

function MessageEditorList({ mensagens, data, clienteId }: { mensagens: Mensagem[] } & Pick<StepProps, "data" | "clienteId">) {
  const [selected, setSelected] = useState<string | null>(null);
  const current = mensagens.find((m) => m.id === selected) ?? mensagens[0];
  return <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.85fr)_minmax(0,1.4fr)]">
    <div className="space-y-1 rounded-lg border border-border p-2">{mensagens.map((m,i) => <button key={m.id} type="button" onClick={() => setSelected(m.id)} className={cn("w-full rounded-md p-3 text-left transition-colors", current?.id === m.id ? "bg-secondary text-foreground" : "hover:bg-secondary/60")}><span className="block text-[13px] font-medium">{i+1}. {m.mensagem}</span><span className="mt-1 block text-xs text-muted-foreground">{m.jornada || "Jornada não definida"} · {data.argumentos.filter((x) => x.mensagem_id === m.id).length} argumentos</span></button>)}</div>
    {current && <MensagemEditor key={current.id} m={current} data={data} clienteId={clienteId}/>}
  </div>;
}

function MensagemEditor({ m, data, clienteId }: { m: Mensagem } & Pick<StepProps, "data" | "clienteId">) {
  const a = useStrategyActions(clienteId);
  const [formats, setFormats] = useState<string[]>(m.formatos ?? []);
  const [details, setDetails] = useState(false);
  const [argumentsOpen, setArgumentsOpen] = useState(false);
  const args = data.argumentos.filter((x) => x.mensagem_id === m.id);
  const upd = (patch: Record<string, unknown>) => a.update("editorial_mensagens", m.id, patch);
  const toggleFormat = async (f: string) => { const next = formats.includes(f) ? formats.filter((x) => x !== f) : [...formats,f]; setFormats(next); try { await upd({ formatos:next }); } catch { setFormats(formats); } };
  return <div className="min-w-0 space-y-4 rounded-lg border border-border p-3 sm:p-4">
    <div className="flex items-center justify-between"><h4 className="text-sm font-semibold">Editar mensagem</h4><button className={btnGhost} onClick={() => { if(window.confirm("Excluir esta mensagem?")) void a.remove("editorial_mensagens",m.id); }} aria-label="Excluir mensagem"><Trash2 size={14}/></button></div>
    <label className="block space-y-1 text-xs font-medium">Mensagem principal<textarea key={m.id} defaultValue={m.mensagem} onBlur={(e) => { if(e.target.value !== m.mensagem) void upd({ mensagem:e.target.value }); }} rows={3} className={`${inputCls} w-full resize-y text-[13px] font-normal`}/></label>
    <div className="space-y-2"><span className="block text-xs font-medium">Formatos possíveis</span><div className="flex flex-wrap gap-2">{FORMATOS.map((f) => <button type="button" key={f} aria-pressed={formats.includes(f)} onClick={() => void toggleFormat(f)} className={cn("rounded-md border px-3 py-1.5 text-xs transition-colors", formats.includes(f) ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-secondary")}>{formats.includes(f) ? "✓ " : ""}{f}</button>)}</div></div>
    <div className="border-t border-border pt-3"><button type="button" onClick={() => setDetails(!details)} aria-expanded={details} className="flex w-full items-center justify-between text-left text-[13px] font-medium">Jornada, intenção e CTA {details ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}</button>{details && <div className="mt-3 space-y-3"><label className="block space-y-1 text-xs">Jornada<select value={m.jornada ?? ""} onChange={(e) => void upd({ jornada:e.target.value || null })} className={`${inputCls} w-full`}><option value="">Selecionar jornada</option>{JORNADA_OPCOES.map((j) => <option key={j} value={j}>{j}</option>)}</select></label><label className="block space-y-1 text-xs">Objetivo psicológico<input key={`${m.id}-objetivo`} defaultValue={m.objetivo_psicologico ?? ""} onBlur={(e) => void upd({ objetivo_psicologico:e.target.value || null })} className={`${inputCls} w-full`}/></label><label className="block space-y-1 text-xs">Chamada para ação (CTA)<input key={`${m.id}-cta`} defaultValue={m.cta ?? ""} onBlur={(e) => void upd({ cta:e.target.value || null })} className={`${inputCls} w-full`}/></label></div>}</div>
    <div className="border-t border-border pt-3"><button type="button" onClick={() => setArgumentsOpen(!argumentsOpen)} aria-expanded={argumentsOpen} className="flex w-full items-center justify-between text-left text-[13px] font-medium">Argumentos e evidências ({args.length}) {argumentsOpen ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}</button>{argumentsOpen && <div className="mt-3 space-y-3">{args.map((x) => <div key={x.id} className="space-y-2 rounded-md border border-border p-3"><div className="flex gap-2"><span className="min-w-0 flex-1 text-[13px]">{x.argumento}</span><button onClick={() => { if(window.confirm("Excluir argumento?")) void a.remove("editorial_argumentos",x.id); }} aria-label="Excluir argumento"><Trash2 size={13}/></button></div><label className="block space-y-1 text-xs text-muted-foreground">Prova vinculada<select value={x.evidencia_id ?? ""} onChange={(e) => void a.update("editorial_argumentos",x.id,{ evidencia_id:e.target.value || null })} className={`${inputCls} w-full`}><option value="">Sem evidência vinculada</option>{data.evidencias.map((e) => <option key={e.id} value={e.id}>{e.informacao.slice(0,100)}</option>)}</select></label></div>)}<AddInline label="Argumento" onAdd={(argumento) => a.insert("editorial_argumentos",{ mensagem_id:m.id, argumento })}/></div>}</div>
  </div>;
}

function AddInline({ label, onAdd }: { label: string; onAdd: (v: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState("");
  if (!open) return <button className={btnGhost} onClick={() => setOpen(true)}><Plus size={13} /> {label}</button>;
  const go = async () => { if (!v.trim()) return; await onAdd(v.trim()); setV(""); setOpen(false); };
  return (
    <span className="inline-flex gap-1">
      <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void go(); if (e.key === "Escape") setOpen(false); }} placeholder={label} className={`${inputCls} h-7 w-48 py-0.5 text-[13px]`} />
      <button className={btn} onClick={go}>OK</button>
    </span>
  );
}
