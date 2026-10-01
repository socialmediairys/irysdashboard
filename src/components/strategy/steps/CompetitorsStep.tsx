import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CONCORRENTE_CAMPOS, SINTESE_COMPETITIVA } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { AutoField, Block, Empty, SaveState, btnPrimary, inputCls } from "../ui";
import { useAutosave, useStrategyActions, type Concorrente } from "../useStrategy";
import { MethodArtifacts } from "./MethodArtifacts";

/** Matriz comparativa: critérios nas linhas, concorrentes nas colunas. Mobile: um concorrente por vez. */
export function CompetitorsStep({ data, clienteId, touch }: StepProps) {
  const a = useStrategyActions(clienteId);
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const add = async () => {
    if (!nome.trim() || busy) return;
    setBusy(true);
    try { await a.insert("estrategia_concorrentes", { id: crypto.randomUUID(), nome: nome.trim() }); setNome(""); touch(); } finally { setBusy(false); }
  };
  const cs = data.concorrentes;
  const mob = cs.find((c) => c.id === sel) ?? cs[0];
  const save = (c: Concorrente, campo: string) => (v: string) => a.update("estrategia_concorrentes", c.id, { [campo]: v || null });
  const def = (k: string) => data.definicoes.find((d) => d.etapa === 5 && d.campo === k)?.valor ?? "";

  return (
    <div className="space-y-10">
      <Block title="Matriz de concorrência" description="Critérios nas linhas, concorrentes nas colunas. Registre o que foi observado."
        action={
          <div className="flex gap-2">
            <input value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nome do concorrente" className={`${inputCls} h-8 w-44 py-1`} />
            <button className={btnPrimary} onClick={add} disabled={!nome.trim() || busy}><Plus size={14} /> Adicionar</button>
          </div>
        }>
        {cs.length ? (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
              <table className="w-full border-separate border-spacing-0 text-[13px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-36 border-b border-r border-border bg-card px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Critério</th>
                    {cs.map((c) => (
                      <th key={c.id} className="min-w-[220px] border-b border-border px-3 py-2.5 text-left font-semibold text-foreground">
                        <div className="flex items-center justify-between gap-2">{c.nome}
                          <button onClick={() => a.remove("estrategia_concorrentes", c.id)} className="text-muted-foreground hover:text-destructive" aria-label={`Remover ${c.nome}`}><Trash2 size={13} strokeWidth={1.6} /></button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONCORRENTE_CAMPOS.map((campo) => (
                    <tr key={campo.key} className="align-top">
                      <td className="sticky left-0 z-10 border-b border-r border-border bg-card px-3 py-2.5 font-medium text-muted-foreground">{campo.label}</td>
                      {cs.map((c) => <td key={c.id} className="border-b border-border px-2 py-1.5"><Cell c={c} campo={campo.key} save={save(c, campo.key)} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="space-y-3 md:hidden">
              <select aria-label="Concorrente" value={mob?.id} onChange={(e) => setSel(e.target.value)} className={inputCls}>
                {cs.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {mob && (
                <div key={mob.id} className="divide-y divide-border rounded-lg border border-border bg-card">
                  {CONCORRENTE_CAMPOS.map((campo) => (
                    <div key={campo.key} className="px-3 py-2.5">
                      <div className="mb-1 text-xs font-medium text-muted-foreground">{campo.label}</div>
                      <Cell c={mob} campo={campo.key} save={save(mob, campo.key)} />
                    </div>
                  ))}
                  <div className="px-3 py-2.5 text-right">
                    <button onClick={() => a.remove("estrategia_concorrentes", mob.id)} className="text-[13px] text-destructive hover:underline">Remover concorrente</button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : <Empty>Nenhum concorrente cadastrado.</Empty>}
      </Block>

      <Block title="Síntese competitiva" description="Conclusões a partir da matriz. Escreva apenas o que os dados mostram.">
        <div className="max-w-3xl space-y-6">
          {SINTESE_COMPETITIVA.map((s) => (
            <AutoField key={s.key} label={s.label} hint={s.hint} initial={def(s.key)} rows={3}
              onSave={async (v) => { await a.saveDefinicao(5, s.key, v); touch(); }} />
          ))}
        </div>
      </Block>


      <MethodArtifacts etapa={5} data={data} clienteId={clienteId} substeps={[
        { key: "selecao", prompt: "Prompt 2", title: "Seleção das Referências", question: "Por que cada empresa entrou na análise e o que queremos aprender com ela?", fields: [
          { key: "c5_selecao", label: "Empresa × tipo × motivo × aprendizado", hint: "Classifique como concorrente direto, concorrente aspiracional ou referência de mecanismo.", rows: 6 },
          { key: "c5_amostra", label: "Amostra e fontes públicas", hint: "Registre posts, reviews, site, anúncios, oferta/preços públicos e jornada aparente analisados.", rows: 4 },
        ]},
        { key: "engenharia", prompt: "Prompt 2", title: "Engenharia Reversa", question: "Qual sistema existe por trás da comunicação de cada referência?", fields: [
          { key: "c5_atrai", label: "Atrai", hint: "Como chama atenção e gera entrada?", rows: 4 },
          { key: "c5_convence", label: "Convence", hint: "Como constrói confiança e muda critérios?", rows: 4 },
          { key: "c5_vende", label: "Vende", hint: "Oferta, CTA e caminho aparente de conversão.", rows: 4 },
          { key: "c5_retem", label: "Retém", hint: "Como sustenta relacionamento/continuidade quando observável.", rows: 4 },
        ]},
        { key: "auditoria", prompt: "Prompt 3", title: "Auditoria da Análise", question: "Separe observação pública de interpretação e marque o que não está confirmado.", fields: [
          { key: "c5_observacoes", label: "Observações sustentadas pelas fontes", rows: 5 },
          { key: "c5_interpretacoes", label: "Interpretações / hipóteses", rows: 5 },
          { key: "c5_nao_confirmado", label: "Não confirmado / lacunas", rows: 4 },
        ]},
      ]} />
    </div>
  );
}

function Cell({ c, campo, save }: { c: Concorrente; campo: string; save: (v: string) => Promise<void> }) {
  const [v, setV] = useState(c[campo] ?? "");
  const st = useAutosave(v, save);
  return (
    <>
      <textarea rows={2} value={v} onChange={(e) => setV(e.target.value)} placeholder="—" className="w-full resize-y rounded border border-transparent bg-transparent px-1.5 py-1 text-[13px] text-foreground placeholder:text-muted-foreground/60 hover:border-border focus:border-input focus:outline-none" />
      {st !== "idle" && st !== "saved" && <SaveState state={st} />}
    </>
  );
}
