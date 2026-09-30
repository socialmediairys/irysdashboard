import { Check, Loader2, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_VARIANT, type EtapaStatus } from "@/lib/strategy";
import { useAutosave, type Sugestao } from "./useStrategy";
import { supabase } from "@/integrations/supabase/client";

export function SaveState({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "idle") return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", state === "error" ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
      {state === "saving" && <><Loader2 size={12} className="animate-spin" /> Salvando…</>}
      {state === "saved" && <><Check size={12} strokeWidth={2} /> Salvo</>}
      {state === "error" && "Não salvo — tente de novo"}
    </span>
  );
}

export function EtapaBadge({ status }: { status: EtapaStatus }) {
  return <StatusBadge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</StatusBadge>;
}

export const inputCls = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30";
export const btn = "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50";
export const btnPrimary = "inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50";
export const btnGhost = "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

/** Textarea with autosave and discreet saved state. */
export function AutoField({ label, hint, initial, onSave, rows = 2, placeholder }: {
  label: string; hint?: string; initial: string; onSave: (v: string) => Promise<void>; rows?: number; placeholder?: string;
}) {
  const [v, setV] = useState(initial);
  const state = useAutosave(v, onSave);
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-foreground">{label}</span>
        <SaveState state={state} />
      </div>
      <textarea rows={rows} value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder ?? hint} className={cn(inputCls, "resize-y leading-relaxed")} />
    </label>
  );
}

export function Block({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">{children}</div>;
}

/** Contextual AI entry point. AI never writes strategy data automatically. */
export function AiChip({ clienteId, data, sugestoes, etapa, onDecide, onGenerated }: {
  clienteId: string; data: import("./useStrategy").StrategyData; sugestoes: Sugestao[]; etapa?: number;
  onDecide: (s: Sugestao, st: "aprovada" | "descartada") => void; onGenerated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const list = sugestoes.filter((s) => etapa == null || s.etapa === etapa);

  const ask = async (action?: string) => {
    const question = (action ?? prompt).trim();
    if (!question || loading) return;
    setLoading(true); setError(""); setAnswer("");
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("strategy-ai", {
        body: { clienteId, etapa: etapa ?? null, action: action ? question : "chat", question: action ? undefined : question },
      });
      if (fnError) throw fnError;
      setAnswer(result?.answer ?? "Análise concluída.");
      if (result?.suggestionsCreated) onGenerated?.();
    } catch (e) {
      console.error(e);
      setError("Não foi possível consultar a IA. Verifique se a função strategy-ai foi publicada e se OPENAI_API_KEY está configurada no Supabase.");
    } finally { setLoading(false); }
  };

  const quick = etapa === 1
    ? ["Analisar briefing e apontar lacunas", "Identificar contradições no briefing"]
    : etapa === 6
      ? ["Analisar evidências e encontrar padrões", "Identificar contradições e lacunas"]
      : etapa === 7
        ? ["Revisar diagnóstico", "Questionar o gargalo principal"]
        : etapa && etapa >= 8 && etapa <= 11
          ? ["Revisar coerência estratégica", "Sugerir melhorias com base nas evidências"]
          : etapa === 12
            ? ["Revisar sistema editorial", "Sugerir temas coerentes com a estratégia"]
            : ["Analisar a estratégia atual", "Encontrar lacunas estratégicas", "Revisar coerência evidências → decisões"];

  return (
    <>
      <button onClick={() => setOpen(true)} className={btnGhost}>
        <Sparkles size={14} strokeWidth={1.6} />
        {list.length ? `${list.length} sugestão(ões) da IA — Revisar` : "Copiloto"}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Sparkles size={16} strokeWidth={1.6} /> Copiloto estratégico</SheetTitle>
            <SheetDescription>Analisa apenas o contexto autorizado deste cliente. IA interpreta; evidências continuam sendo registros humanos verificáveis.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5 px-4 pb-6">
            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Ações rápidas</div>
              <div className="flex flex-wrap gap-2">{quick.map(q => <button key={q} className={btn} disabled={loading} onClick={() => void ask(q)}>{q}</button>)}</div>
            </div>
            <div className="space-y-2">
              <textarea className={cn(inputCls, "min-h-24 resize-y")} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Pergunte sobre briefing, evidências, concorrência, diagnóstico, posicionamento ou sistema editorial…" />
              <button className={btnPrimary} disabled={loading || !prompt.trim()} onClick={() => void ask()}>{loading ? <><Loader2 size={14} className="animate-spin" /> Analisando…</> : <><Sparkles size={14} /> Analisar</>}</button>
            </div>
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
            {answer && <div className="rounded-md border border-border bg-secondary/40 p-4"><div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Análise da IA</div><p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{answer}</p></div>}
            <div className="border-t border-border pt-4">
              <div className="mb-3 text-xs font-medium text-muted-foreground">Sugestões pendentes</div>
              {list.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma sugestão estruturada pendente.</p> : list.map((s) => (
                <div key={s.id} className="mb-3 rounded-md border border-dashed border-primary/40 bg-primary-soft/40 p-3">
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sugestão da IA · {s.tipo}</div>
                  <p className="text-sm text-foreground">{s.conteudo}</p>
                  <div className="mt-3 flex gap-2"><button className={btnPrimary} onClick={() => onDecide(s, "aprovada")}>Aceitar</button><button className={btn} onClick={() => onDecide(s, "descartada")}>Descartar</button></div>
                </div>
              ))}
            </div>
            <div className="text-[11px] leading-relaxed text-muted-foreground">Contexto disponível: {data.evidencias.length} evidências · {data.fontes.length} fontes · {data.concorrentes.length} concorrentes · {data.achados.filter(a => a.status !== "descartado").length} achados. A IA não recebe dados de outros clientes.</div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

