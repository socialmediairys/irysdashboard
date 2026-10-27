import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { isMonthKey, monthKey, monthLabel, shiftMonth } from "@/lib/content";

export const rememberMonth = (scope: string, mes: string) => localStorage.setItem(`irys:mes:${scope}`, mes);

/** Mês selecionado persistido por escopo (sobrevive a recarregar a página). */
export function useMonthState(scope: string) {
  const storageKey = `irys:mes:${scope}`;
  const [mes, setMes] = useState(() => monthKey());
  useEffect(() => { const v = localStorage.getItem(storageKey); if (isMonthKey(v)) setMes(v); }, [storageKey]);
  const set = (v: string) => { setMes(v); localStorage.setItem(storageKey, v); };
  return [mes, set] as const;
}

export function MonthNav({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const atual = monthKey();
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
      <button onClick={() => onChange(shiftMonth(value, -1))} aria-label="Mês anterior" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><ChevronLeft size={14} /></button>
      <span className="min-w-32 text-center text-[13px] font-medium text-foreground" aria-live="polite">{monthLabel(value)}</span>
      <button onClick={() => onChange(shiftMonth(value, 1))} aria-label="Próximo mês" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><ChevronRight size={14} /></button>
      {value !== atual && <button onClick={() => onChange(atual)} className="rounded px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground">Mês atual</button>}
    </div>
  );
}
