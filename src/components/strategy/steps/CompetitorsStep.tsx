import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CONCORRENTE_CAMPOS } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { Block, Empty, SaveState, btnPrimary, inputCls } from "../ui";
import { useAutosave, useStrategyActions, type Concorrente } from "../useStrategy";

/** Matriz comparativa: concorrentes nas colunas, critérios nas linhas. Autosave por célula. */
export function CompetitorsStep({ data, clienteId, touch }: StepProps) {
  const a = useStrategyActions(clienteId);
  const [nome, setNome] = useState("");
  const add = async () => { if (!nome.trim()) return; await a.insert("estrategia_concorrentes", { nome: nome.trim() }); setNome(""); touch(); };

  return (
    <Block title="Matriz de concorrência" description="Compare posicionamento, oferta e comunicação."
      action={
        <div className="flex gap-2">
          <input value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nome do concorrente" className={`${inputCls} h-8 w-48 py-1`} />
          <button className={btnPrimary} onClick={add} disabled={!nome.trim()}><Plus size={14} /> Adicionar</button>
        </div>
      }>
      {data.concorrentes.length ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="w-40 px-3 py-2.5 text-left font-medium text-muted-foreground">Critério</th>
                {data.concorrentes.map((c) => (
                  <th key={c.id} className="min-w-[200px] px-3 py-2.5 text-left font-semibold text-foreground">
                    <div className="flex items-center justify-between gap-2">{c.nome}
                      <button onClick={() => a.remove("estrategia_concorrentes", c.id)} className="text-muted-foreground hover:text-destructive" aria-label={`Remover ${c.nome}`}><Trash2 size={13} strokeWidth={1.6} /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONCORRENTE_CAMPOS.map((campo) => (
                <tr key={campo.key} className="border-b border-border last:border-0 align-top">
                  <td className="px-3 py-2 text-muted-foreground">{campo.label}</td>
                  {data.concorrentes.map((c) => <Cell key={c.id} c={c} campo={campo.key} save={(v) => a.update("estrategia_concorrentes", c.id, { [campo.key]: v || null })} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty>Nenhum concorrente cadastrado.</Empty>}
    </Block>
  );
}

function Cell({ c, campo, save }: { c: Concorrente; campo: string; save: (v: string) => Promise<void> }) {
  const [v, setV] = useState(c[campo] ?? "");
  const st = useAutosave(v, save);
  return (
    <td className="px-2 py-1.5">
      <textarea rows={2} value={v} onChange={(e) => setV(e.target.value)} className="w-full resize-y rounded border border-transparent bg-transparent px-1.5 py-1 text-[13px] text-foreground hover:border-border focus:border-input focus:outline-none" />
      {st !== "idle" && st !== "saved" && <SaveState state={st} />}
    </td>
  );
}
