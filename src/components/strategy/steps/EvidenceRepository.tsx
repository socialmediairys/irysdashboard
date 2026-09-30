import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIA_LABEL, EVIDENCIA_CATEGORIAS, STEPS } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { Block, Empty, btnPrimary, inputCls } from "../ui";
import { useStrategyActions, type Evidencia } from "../useStrategy";
import { EvidenceSheet, draftToRow } from "./EvidenceSheet";
import { EvidenceRow } from "./EvidenceRow";

/** Etapa 6: o conjunto das evidências, agrupável por categoria, para enxergar padrões. */
export function EvidenceRepository({ data, clienteId, touch }: StepProps) {
  const a = useStrategyActions(clienteId);
  const [q, setQ] = useState("");
  const [etapa, setEtapa] = useState("");
  const [cat, setCat] = useState<string>("");
  const [edit, setEdit] = useState<Evidencia | null>(null);
  const [open, setOpen] = useState(false);

  const usage = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of data.links) m.set(l.evidencia_id, (m.get(l.evidencia_id) ?? 0) + 1);
    return m;
  }, [data.links]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of data.evidencias) m.set(e.categoria ?? "", (m.get(e.categoria ?? "") ?? 0) + 1);
    return m;
  }, [data.evidencias]);
  const cats = [...EVIDENCIA_CATEGORIAS.map((c) => c.key), ...[...counts.keys()].filter((k) => k && !EVIDENCIA_CATEGORIAS.some((c) => c.key === k))].filter((k) => counts.get(k));

  const list = data.evidencias.filter((e) =>
    (!q || `${e.informacao} ${e.origem ?? ""} ${e.observacao ?? ""}`.toLowerCase().includes(q.toLowerCase())) &&
    (!etapa || String(e.etapa ?? "") === etapa) && (cat === "" || (cat === "_none" ? !e.categoria : e.categoria === cat)));

  const chip = (k: string, label: string, n: number) => (
    <button key={k} onClick={() => setCat(cat === k ? "" : k)}
      className={cn("rounded-md px-2.5 py-1 text-[13px] transition-colors", cat === k ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
      {label} <span className="text-xs text-muted-foreground">{n}</span>
    </button>
  );

  return (
    <Block title="Conjunto de evidências" description={`${data.evidencias.length} evidência(s) · ${data.fontes.length} fonte(s)`}
      action={<button className={btnPrimary} onClick={() => { setEdit(null); setOpen(true); }}><Plus size={14} /> Evidência</button>}>
      <div className="mb-3 flex flex-wrap gap-1 border-b border-border pb-3">
        {chip("", "Todas", data.evidencias.length)}
        {cats.map((k) => chip(k, CATEGORIA_LABEL[k] ?? k, counts.get(k) ?? 0))}
        {counts.get("") ? chip("_none", "Sem categoria", counts.get("") ?? 0) : null}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className={`${inputCls} h-8 py-1 pl-8`} />
        </div>
        <select aria-label="Etapa de origem" value={etapa} onChange={(e) => setEtapa(e.target.value)} className={`${inputCls} h-8 w-auto py-1`}>
          <option value="">Todas as etapas</option>
          {STEPS.slice(0, 7).map((s) => <option key={s.n} value={s.n}>{s.n}. {s.titulo}</option>)}
        </select>
      </div>
      {list.length ? (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {list.map((e) => (
            <EvidenceRow key={e.id} e={e} fontes={data.fontes} onOpen={() => { setEdit(e); setOpen(true); }}
              extra={usage.get(e.id) ? <span className="shrink-0 text-xs text-muted-foreground">sustenta {usage.get(e.id)}</span> : null} />
          ))}
        </div>
      ) : <Empty>{data.evidencias.length ? "Nenhuma evidência com esses filtros." : "Nenhuma evidência registrada. Comece pelas etapas de Pesquisa."}</Empty>}

      <EvidenceSheet open={open} onOpenChange={setOpen} etapa={edit?.etapa ?? 6} fontes={data.fontes} initial={edit}
        onSave={async (d, isNew) => { if (isNew) await a.insert("estrategia_evidencias", { id: d.id, ...draftToRow(d) }); else await a.update("estrategia_evidencias", d.id, draftToRow(d)); touch(); }}
        onDelete={edit ? () => a.remove("estrategia_evidencias", edit.id) : undefined} />
    </Block>
  );
}
