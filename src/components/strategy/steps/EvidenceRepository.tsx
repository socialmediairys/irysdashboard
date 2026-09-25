import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORIA_LABEL, STEPS } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { Block, Empty, btnPrimary, inputCls } from "../ui";
import { useStrategyActions, type Evidencia } from "../useStrategy";
import { EvidenceSheet, draftToRow } from "./EvidenceSheet";

/** Repositório transversal: todas as evidências do cliente, filtráveis sem entrar em cada etapa. */
export function EvidenceRepository({ data, clienteId, touch }: StepProps) {
  const a = useStrategyActions(clienteId);
  const [q, setQ] = useState("");
  const [etapa, setEtapa] = useState("");
  const [cat, setCat] = useState("");
  const [edit, setEdit] = useState<Evidencia | null>(null);
  const [open, setOpen] = useState(false);

  const usage = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of data.links) m.set(l.evidencia_id, (m.get(l.evidencia_id) ?? 0) + 1);
    return m;
  }, [data.links]);

  const list = data.evidencias.filter((e) =>
    (!q || `${e.informacao} ${e.origem ?? ""} ${e.observacao ?? ""}`.toLowerCase().includes(q.toLowerCase())) &&
    (!etapa || String(e.etapa ?? "") === etapa) && (!cat || e.categoria === cat));
  const fonte = (id: string | null) => data.fontes.find((f) => f.id === id)?.nome;

  return (
    <Block title="Repositório de evidências" description={`${data.evidencias.length} evidência(s) registradas`}
      action={<button className={btnPrimary} onClick={() => { setEdit(null); setOpen(true); }}><Plus size={14} /> Evidência</button>}>
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className={`${inputCls} h-8 py-1 pl-8`} />
        </div>
        <select value={etapa} onChange={(e) => setEtapa(e.target.value)} className={`${inputCls} h-8 w-auto py-1`}>
          <option value="">Todas as etapas</option>
          {STEPS.slice(0, 7).map((s) => <option key={s.n} value={s.n}>{s.n}. {s.titulo}</option>)}
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} h-8 w-auto py-1`}>
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORIA_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      {list.length ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Evidência</th><th className="px-3 py-2.5 font-medium">Etapa</th>
              <th className="px-3 py-2.5 font-medium">Categoria</th><th className="px-3 py-2.5 font-medium">Fonte</th><th className="px-3 py-2.5 font-medium">Sustenta</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {list.map((e) => (
                <tr key={e.id} className="cursor-pointer hover:bg-accent" onClick={() => { setEdit(e); setOpen(true); }}>
                  <td className="max-w-md px-4 py-2.5 text-foreground">{e.informacao}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{e.etapa ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{e.categoria ? CATEGORIA_LABEL[e.categoria] ?? e.categoria : "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{fonte(e.fonte_id) ?? e.origem ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{usage.get(e.id) ? `${usage.get(e.id)} achado(s)` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty>{data.evidencias.length ? "Nenhuma evidência com esses filtros." : "Nenhuma evidência registrada. Comece pelas etapas de Pesquisa."}</Empty>}

      <EvidenceSheet open={open} onOpenChange={setOpen} etapa={edit?.etapa ?? 6} fontes={data.fontes} initial={edit}
        onSave={async (d) => { if (edit) await a.update("estrategia_evidencias", edit.id, draftToRow(d)); else await a.insert("estrategia_evidencias", draftToRow(d)); touch(); }}
        onDelete={edit ? () => a.remove("estrategia_evidencias", edit.id) : undefined} />
    </Block>
  );
}
