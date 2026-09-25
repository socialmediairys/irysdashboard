import { Check, Loader2, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_VARIANT, type EtapaStatus } from "@/lib/strategy";
import { useAutosave, type Sugestao } from "./useStrategy";

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

/** Contextual AI entry point. Suggestions are always visually separated from real evidence. */
export function AiChip({ sugestoes, etapa, onDecide }: { sugestoes: Sugestao[]; etapa?: number; onDecide: (s: Sugestao, st: "aprovada" | "descartada") => void }) {
  const [open, setOpen] = useState(false);
  const list = sugestoes.filter((s) => etapa == null || s.etapa === etapa);
  return (
    <>
      <button onClick={() => setOpen(true)} className={btnGhost}>
        <Sparkles size={14} strokeWidth={1.6} />
        {list.length ? `${list.length} sugestão(ões) da IA — Revisar` : "Copiloto"}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Sparkles size={16} strokeWidth={1.6} /> Copiloto estratégico</SheetTitle>
            <SheetDescription>Sugestões são inferências — nunca evidências. Aprove, edite ou descarte cada uma.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3 px-4 pb-6">
            {list.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhuma sugestão pendente. A geração automática (síntese de evidências, padrões, lacunas e hipóteses) está preparada, mas ainda não foi ativada.
              </p>
            ) : list.map((s) => (
              <div key={s.id} className="rounded-md border border-dashed border-primary/40 bg-primary-soft/40 p-3">
                <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sugestão da IA · {s.tipo}</div>
                <p className="text-sm text-foreground">{s.conteudo}</p>
                <div className="mt-3 flex gap-2">
                  <button className={btnPrimary} onClick={() => onDecide(s, "aprovada")}>Aprovar</button>
                  <button className={btn} onClick={() => onDecide(s, "descartada")}>Descartar</button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
