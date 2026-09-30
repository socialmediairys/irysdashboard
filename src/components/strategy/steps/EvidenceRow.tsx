import { useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIA_LABEL } from "@/lib/strategy";
import type { Evidencia, Fonte } from "../useStrategy";

export const fmtDate = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR") : null);

/** Linha compacta de evidência: categoria · resumo · fonte · origem. Texto longo expande. */
export function EvidenceRow({ e, fontes, onOpen, extra, className }: {
  e: Evidencia; fontes: Fonte[]; onOpen?: () => void; extra?: React.ReactNode; className?: string;
}) {
  const [exp, setExp] = useState(false);
  const long = e.informacao.length > 180;
  const fonte = fontes.find((f) => f.id === e.fonte_id)?.nome;
  const meta = [fonte && `Fonte: ${fonte}`, e.origem, e.etapa && `Etapa ${e.etapa}`, fmtDate(e.data_ref)].filter(Boolean) as string[];
  return (
    <div className={cn("flex items-start gap-3 px-4 py-3", className)}>
      <span className="mt-0.5 w-28 shrink-0 text-xs text-muted-foreground">{e.categoria ? CATEGORIA_LABEL[e.categoria] ?? e.categoria : "Sem categoria"}</span>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onOpen} className="block w-full text-left text-[13px] text-foreground hover:underline disabled:no-underline" disabled={!onOpen}>
          {long && !exp ? `${e.informacao.slice(0, 180).trimEnd()}…` : e.informacao}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          {meta.map((m) => <span key={m}>{m}</span>)}
          {long && <button type="button" className="hover:text-foreground" onClick={() => setExp(!exp)}>{exp ? "Mostrar menos" : "Ler tudo"}</button>}
        </div>
      </div>
      {extra}
    </div>
  );
}
