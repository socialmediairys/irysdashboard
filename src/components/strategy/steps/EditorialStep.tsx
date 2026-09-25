import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { JORNADA_OPCOES } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { Block, Empty, btn, btnGhost, inputCls } from "../ui";
import { useStrategyActions, type Mensagem } from "../useStrategy";

const FORMATOS = ["Reels", "Carrossel", "Story", "Post", "Vídeo", "Live"];

/** Pilar → Tema → Mensagem → Argumento/Prova. Estrutura consumida pelo Calendário e, na Fase 5, pelo Conteúdo. */
export function EditorialStep({ data, clienteId, touch }: StepProps) {
  const a = useStrategyActions(clienteId);
  const [pilarSel, setPilarSel] = useState<string | null>(data.pilares[0]?.id ?? null);
  const [novoPilar, setNovoPilar] = useState("");
  const legado = Array.isArray(data.legado?.pilares) ? (data.legado!.pilares as string[]) : [];
  const pilar = data.pilares.find((p) => p.id === pilarSel) ?? data.pilares[0];
  const temas = data.temas.filter((t) => t.pilar_id === pilar?.id);

  const addPilar = async (nome: string) => { if (!nome.trim()) return; await a.insert("editorial_pilares", { nome: nome.trim(), ordem: data.pilares.length }); setNovoPilar(""); touch(); };

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-3">
        <div className="text-[13px] font-medium text-foreground">Pilares</div>
        <ul className="space-y-0.5">
          {data.pilares.map((p) => (
            <li key={p.id}>
              <button onClick={() => setPilarSel(p.id)} className={cn("flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-[13px]",
                pilar?.id === p.id ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <span className="truncate">{p.nome}</span><span className="text-xs">{data.temas.filter((t) => t.pilar_id === p.id).length}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-1">
          <input value={novoPilar} onChange={(e) => setNovoPilar(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPilar(novoPilar)} placeholder="Novo pilar" className={`${inputCls} h-8 py-1`} />
          <button className={btn} onClick={() => addPilar(novoPilar)} aria-label="Adicionar pilar"><Plus size={14} /></button>
        </div>
        {!data.pilares.length && legado.length > 0 && (
          <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            Pilares da estratégia anterior: {legado.join(", ")}.
            <button className="mt-2 block text-foreground underline" onClick={async () => { for (const [i, n] of legado.entries()) await a.insert("editorial_pilares", { nome: n, ordem: i }); touch(); }}>Importar como pilares</button>
          </div>
        )}
      </aside>

      <div className="min-w-0">
        {pilar ? (
          <Block title={pilar.nome} description="Temas, mensagens e argumentos deste pilar"
            action={<div className="flex gap-1">
              <AddInline label="Tema" onAdd={async (nome) => { await a.insert("editorial_temas", { pilar_id: pilar.id, nome }); touch(); }} />
              <button className={btnGhost} onClick={() => a.remove("editorial_pilares", pilar.id)} aria-label="Excluir pilar"><Trash2 size={14} strokeWidth={1.6} /></button>
            </div>}>
            {temas.length ? (
              <div className="space-y-6">
                {temas.map((t) => (
                  <div key={t.id} className="rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                      <div className="flex items-center gap-2 text-[13px]"><span className="text-muted-foreground">Tema</span><ChevronRight size={12} className="text-muted-foreground" /><span className="font-medium text-foreground">{t.nome}</span></div>
                      <div className="flex gap-1">
                        <AddInline label="Mensagem" onAdd={async (mensagem) => { await a.insert("editorial_mensagens", { tema_id: t.id, mensagem }); touch(); }} />
                        <button className={btnGhost} onClick={() => a.remove("editorial_temas", t.id)} aria-label="Excluir tema"><Trash2 size={13} strokeWidth={1.6} /></button>
                      </div>
                    </div>
                    <div className="divide-y divide-border">
                      {data.mensagens.filter((m) => m.tema_id === t.id).map((m) => <MensagemRow key={m.id} m={m} data={data} clienteId={clienteId} />)}
                      {!data.mensagens.some((m) => m.tema_id === t.id) && <div className="px-4 py-3 text-[13px] text-muted-foreground">Nenhuma mensagem.</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <Empty>Adicione temas a este pilar.</Empty>}
          </Block>
        ) : <Empty>Crie o primeiro pilar editorial.</Empty>}
      </div>
    </div>
  );
}

function MensagemRow({ m, data, clienteId }: { m: Mensagem } & Pick<StepProps, "data" | "clienteId">) {
  const a = useStrategyActions(clienteId);
  const args = data.argumentos.filter((x) => x.mensagem_id === m.id);
  const upd = (patch: Record<string, unknown>) => a.update("editorial_mensagens", m.id, patch);
  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-medium text-foreground">{m.mensagem}</div>
        <button className="text-muted-foreground hover:text-destructive" onClick={() => a.remove("editorial_mensagens", m.id)} aria-label="Excluir mensagem"><Trash2 size={13} strokeWidth={1.6} /></button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <select defaultValue={m.jornada ?? ""} onChange={(e) => upd({ jornada: e.target.value || null })} className={`${inputCls} h-8 py-1 text-[13px]`} aria-label="Jornada">
          <option value="">Jornada</option>{JORNADA_OPCOES.map((j) => <option key={j}>{j}</option>)}
        </select>
        <input defaultValue={m.objetivo_psicologico ?? ""} onBlur={(e) => upd({ objetivo_psicologico: e.target.value || null })} placeholder="Objetivo psicológico" className={`${inputCls} h-8 py-1 text-[13px]`} />
        <input defaultValue={m.cta ?? ""} onBlur={(e) => upd({ cta: e.target.value || null })} placeholder="CTA" className={`${inputCls} h-8 py-1 text-[13px]`} />
      </div>
      <div className="flex flex-wrap gap-1">
        {FORMATOS.map((f) => {
          const on = m.formatos.includes(f);
          return <button key={f} onClick={() => upd({ formatos: on ? m.formatos.filter((x) => x !== f) : [...m.formatos, f] })}
            className={cn("rounded-full border px-2 py-0.5 text-xs", on ? "border-foreground/40 bg-secondary text-foreground" : "border-border text-muted-foreground")}>{f}</button>;
        })}
      </div>
      <div className="space-y-1.5 border-l-2 border-border pl-3">
        {args.map((x) => (
          <div key={x.id} className="flex items-start gap-2 text-[13px]">
            <div className="min-w-0 flex-1">
              <span className="text-foreground">{x.argumento}</span>
              <select defaultValue={x.evidencia_id ?? ""} onChange={(e) => a.update("editorial_argumentos", x.id, { evidencia_id: e.target.value || null })} className="ml-2 max-w-[220px] rounded border border-border bg-card px-1 text-xs text-muted-foreground" aria-label="Prova (evidência)">
                <option value="">Prova: sem evidência</option>
                {data.evidencias.map((e) => <option key={e.id} value={e.id}>Prova: {e.informacao.slice(0, 50)}</option>)}
              </select>
            </div>
            <button className="text-muted-foreground hover:text-destructive" onClick={() => a.remove("editorial_argumentos", x.id)} aria-label="Excluir argumento"><Trash2 size={12} strokeWidth={1.6} /></button>
          </div>
        ))}
        <AddInline label="Argumento" onAdd={(argumento) => a.insert("editorial_argumentos", { mensagem_id: m.id, argumento })} />
      </div>
    </div>
  );
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
