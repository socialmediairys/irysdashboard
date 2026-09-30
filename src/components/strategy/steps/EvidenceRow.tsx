import { useState } from "react";
import { Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIA_LABEL, EVIDENCIA_CATEGORIAS } from "@/lib/strategy";
import type { Evidencia, Fonte } from "../useStrategy";

export const fmtDate = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR") : null);

/** Linha compacta de evidência: categoria · classificação · resumo · fonte · origem. */
export function EvidenceRow({ e, fontes, onOpen, onCategoryChange, onSplit, extra, className }: {
  e: Evidencia; fontes: Fonte[]; onOpen?: () => void; onCategoryChange?: (categoria: string | null) => Promise<void>;
  onSplit?: () => void; extra?: React.ReactNode; className?: string;
}) {
  const [exp, setExp] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const long = e.informacao.length > 180;
  const fonte = fontes.find((f) => f.id === e.fonte_id)?.nome;
  const meta = [e.classificacao || null, fonte && `Fonte: ${fonte}`, e.origem, e.etapa && `Etapa ${e.etapa}`, fmtDate(e.data_ref)].filter(Boolean) as string[];

  const changeCategory = async (value: string) => {
    if (!onCategoryChange || savingCat) return;
    setSavingCat(true);
    try { await onCategoryChange(value || null); } finally { setSavingCat(false); }
  };

  return (
    <div className={cn("flex items-start gap-3 px-4 py-3", className)}>
      <div className="w-36 shrink-0">
        {onCategoryChange ? (
          <select aria-label="Categoria da evidência" value={e.categoria ?? ""} disabled={savingCat}
            onChange={(ev) => void changeCategory(ev.target.value)}
            className="h-7 w-full rounded-md border border-transparent bg-transparent px-1.5 text-xs text-muted-foreground outline-none transition-colors hover:border-border hover:bg-card focus:border-input focus:bg-card disabled:opacity-50">
            <option value="">Sem categoria</option>
            {EVIDENCIA_CATEGORIAS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        ) : <span className="text-xs text-muted-foreground">{e.categoria ? CATEGORIA_LABEL[e.categoria] ?? e.categoria : "Sem categoria"}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onOpen} className="block w-full text-left text-[13px] leading-relaxed text-foreground hover:underline disabled:no-underline" disabled={!onOpen}>
          {long && !exp ? `${e.informacao.slice(0, 180).trimEnd()}…` : e.informacao}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {meta.map((m, i) => <span key={`${m}-${i}`}>{m}</span>)}
          {long && <button type="button" className="hover:text-foreground" onClick={() => setExp(!exp)}>{exp ? "Mostrar menos" : "Ler tudo"}</button>}
          {onSplit && long && <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={onSplit}><Scissors size={11} /> Desmembrar</button>}
        </div>
      </div>
      {extra}
    </div>
  );
}
