import { Link2, Plus, Search } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { ACHADO_LABEL, CATEGORIA_LABEL, type AchadoTipo } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { AutoField, Empty, btn, btnPrimary, inputCls } from "../ui";
import { toast } from "sonner";
import { db, useStrategyActions, type Achado, type StrategyData } from "../useStrategy";
import { EvidenceRow } from "./EvidenceRow";
import { MethodArtifacts } from "./MethodArtifacts";

const STATUS: Record<string, { label: string; v: "neutral" | "success" | "danger" | "info" }> = {
  aberto: { label: "Aberto", v: "neutral" }, validado: { label: "Validado", v: "info" }, descartado: { label: "Descartado", v: "danger" }, aprovado: { label: "Aprovado", v: "success" },
};

/** Diagnóstico como raciocínio: evidências → padrões/tensões → problemas/oportunidades → hipóteses → gargalo → decisão. */
export function DiagnosisStep({ data, clienteId, touch }: StepProps) {
  const a = useStrategyActions(clienteId);
  const [sel, setSel] = useState<string | null>(null);
  const linksOf = (id: string) => data.links.filter((l) => l.achado_id === id).map((l) => l.evidencia_id);
  const usadas = new Set(data.links.map((l) => l.evidencia_id));
  const evUsadas = data.evidencias.filter((e) => usadas.has(e.id));
  const of = (t: AchadoTipo) => data.achados.filter((x) => x.tipo === t);
  const gargalo = of("gargalo_principal").find((g) => g.status !== "descartado");
  const add = async (tipo: AchadoTipo, titulo: string) => {
    await a.insert("estrategia_achados", { id: crypto.randomUUID(), etapa: 7, tipo, titulo, status: tipo === "decisao" ? "aprovado" : "aberto" });
    touch();
  };
  const list = (t: AchadoTipo) => <Items items={of(t)} links={linksOf} onOpen={setSel} onAdd={(v) => add(t, v)} placeholder={`Novo(a) ${ACHADO_LABEL[t].toLowerCase()}…`} />;

  return (
    <div className="max-w-5xl space-y-8">
      <MethodArtifacts etapa={7} data={data} clienteId={clienteId} substeps={[
        { key: "sintoma_causa", prompt: "Prompt 8", title: "Sintoma → Causa", question: "Quais sintomas observamos e quais causas podem explicá-los?", fields: [
          { key: "e7_sintomas", label: "Sintomas observados", hint: "Sintomas concretos sustentados pelas evidências.", rows: 5 },
          { key: "e7_causas", label: "Causas possíveis", hint: "Causas prováveis, evidências e o que ainda falta saber.", rows: 5 },
        ]},
        { key: "validacao", prompt: "Prompt 9", title: "Validação das hipóteses", question: "O que cada hipótese explica e o que a contradiz?", fields: [
          { key: "e7_validacao", label: "Matriz de validação", hint: "Hipótese | explica | evidência favorável | evidência contrária | lacuna | resultado (mantida/em aberto/descartada).", rows: 8 },
        ]},
        { key: "priorizacao", prompt: "Prompt 10", title: "Priorização dos gargalos", question: "Qual gargalo deve receber prioridade estratégica?", fields: [
          { key: "e7_priorizacao", label: "Matriz de priorização", hint: "Avalie candidatos por Impacto, Abrangência, Evidência, Frequência, Dependência, Influência e Urgência (0–3 cada; máximo 21).", rows: 8 },
        ]},
        { key: "veredito", prompt: "Prompt 11", title: "Veredito estratégico", question: "Qual é o problema estratégico que deve orientar a próxima decisão?", fields: [
          { key: "e7_problema_estrategico", label: "Problema estratégico", hint: "Formule o problema central em uma frase clara.", rows: 4 },
          { key: "e7_veredito", label: "Veredito", hint: "Objetivo inicial, resultado atual, gargalo prioritário, causas, evidências, hipóteses descartadas e lacunas.", rows: 7 },
        ]},
      ]} />
      <Stage n={1} title="Evidências" q="Em que nos apoiamos?">
        <p className="mb-3 text-[13px] text-muted-foreground">
          {evUsadas.length} de {data.evidencias.length} evidência(s) sustentam algum item deste diagnóstico. Vincule evidências existentes ao abrir cada item — elas não são copiadas.
        </p>
        {evUsadas.length > 0 && (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {evUsadas.slice(0, 5).map((e) => <EvidenceRow key={e.id} e={e} fontes={data.fontes} />)}
            {evUsadas.length > 5 && <div className="px-4 py-2 text-xs text-muted-foreground">+ {evUsadas.length - 5} outras</div>}
          </div>
        )}
      </Stage>

      <Stage n={2} title="Padrões e tensões" q="O que se repete e o que se contradiz?">
        <div className="grid gap-6 md:grid-cols-2">
          <Col title="Padrões" q="O que aparece repetidamente?">{list("padrao")}</Col>
          <Col title="Tensões" q="Que contradições ou conflitos aparecem?">{list("tensao")}</Col>
        </div>
      </Stage>

      <Stage n={3} title="Problemas e oportunidades" q="O que isso significa para o negócio?">
        <div className="grid gap-6 md:grid-cols-2">
          <Col title="Problemas identificados">{list("problema")}</Col>
          <Col title="Oportunidades identificadas">{list("oportunidade")}</Col>
        </div>
      </Stage>

      <Stage n={4} title="Hipóteses" q="Qual explicação parece mais provável? Ainda não validada.">
        {list("hipotese")}
      </Stage>

      <Stage n={5} title="Gargalo" q="O que mais trava o crescimento hoje?">
        {gargalo ? (
          <div className="rounded-lg border border-foreground/30 bg-card">
            <div className="px-5 py-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gargalo principal</div>
              <button onClick={() => setSel(gargalo.id)} className="mt-1 text-left text-base font-semibold text-foreground hover:underline">{gargalo.titulo}</button>
            </div>
            <div className="border-t border-border px-5 py-4">
              <AutoField key={gargalo.id} label="Por que este é o gargalo?" hint="Justifique com base nas evidências" initial={gargalo.descricao ?? ""} rows={3}
                onSave={(v) => a.update("estrategia_achados", gargalo.id, { descricao: v || null })} />
            </div>
            <div className="border-t border-border px-5 py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-medium text-foreground">Evidências relacionadas ({linksOf(gargalo.id).length})</span>
                <button className={btn} onClick={() => setSel(gargalo.id)}><Link2 size={13} /> Vincular</button>
              </div>
              {linksOf(gargalo.id).length ? (
                <div className="divide-y divide-border rounded-md border border-border">
                  {data.evidencias.filter((e) => linksOf(gargalo.id).includes(e.id)).map((e) => <EvidenceRow key={e.id} e={e} fontes={data.fontes} className="px-3" />)}
                </div>
              ) : <p className="text-[13px] text-muted-foreground">Nenhuma evidência vinculada. Um gargalo sem evidência é apenas uma opinião.</p>}
            </div>
          </div>
        ) : (
          <InlineAdd placeholder="Definir o gargalo principal…" onAdd={(v) => add("gargalo_principal", v)} />
        )}
        <div className="mt-6">
          <Col title="Gargalos secundários">{list("gargalo_secundario")}</Col>
        </div>
      </Stage>

      <Stage n={6} title="Decisão estratégica" q="O que faremos diante deste diagnóstico?" last>
        {list("decisao")}
      </Stage>

      <AchadoSheet achado={sel ? data.achados.find((x) => x.id === sel) ?? null : null} onClose={() => setSel(null)} data={data} clienteId={clienteId} />
    </div>
  );
}

function Stage({ n, title, q, children, last }: { n: number; title: string; q: string; children: ReactNode; last?: boolean }) {
  return (
    <section className="relative grid grid-cols-[28px_1fr] gap-4">
      <div className="flex flex-col items-center">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-xs font-medium text-muted-foreground">{n}</span>
        {!last && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className={cn("min-w-0", !last && "pb-10")}>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mb-4 mt-0.5 text-[13px] text-muted-foreground">{q}</p>
        {children}
      </div>
    </section>
  );
}

function Col({ title, q, children }: { title: string; q?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 text-[13px] font-medium text-foreground">{title}</div>
      {q && <div className="-mt-1.5 mb-2 text-xs text-muted-foreground">{q}</div>}
      {children}
    </div>
  );
}

function InlineAdd({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => Promise<void> }) {
  const [v, setV] = useState("");
  const lock = useRef(false);
  const go = async () => {
    const t = v.trim(); if (!t || lock.current) return;
    lock.current = true;
    try { await onAdd(t); setV(""); } finally { lock.current = false; }
  };
  return (
    <div className="flex gap-2">
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder={placeholder} className={`${inputCls} h-8 py-1`} />
      <button className={btn} onClick={go} disabled={!v.trim()} aria-label="Adicionar"><Plus size={14} /></button>
    </div>
  );
}

function Items({ items, links, onOpen, onAdd, placeholder }: { items: Achado[]; links: (id: string) => string[]; onOpen: (id: string) => void; onAdd: (v: string) => Promise<void>; placeholder: string }) {
  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {items.map((x) => {
            const n = links(x.id).length;
            return (
              <li key={x.id}>
                <button onClick={() => onOpen(x.id)} className={cn("flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-accent", x.status === "descartado" && "opacity-60")}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-foreground">{x.titulo}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {n ? `Sustentado por ${n} evidência(s) · Ver evidências` : "Sem evidência vinculada"}{x.origem === "ia" && " · sugerido pela IA"}
                    </div>
                  </div>
                  {x.status !== "aberto" && x.status !== "aprovado" && <StatusBadge variant={STATUS[x.status]?.v ?? "neutral"}>{STATUS[x.status]?.label ?? x.status}</StatusBadge>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <InlineAdd placeholder={placeholder} onAdd={onAdd} />
    </div>
  );
}

function AchadoSheet({ achado, onClose, data, clienteId }: { achado: Achado | null; onClose: () => void; data: StrategyData; clienteId: string }) {
  const a = useStrategyActions(clienteId);
  const [desc, setDesc] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const linked = new Set(data.links.filter((l) => l.achado_id === achado?.id).map((l) => l.evidencia_id));
  const origem = achado?.deriva_de ? data.achados.find((x) => x.id === achado.deriva_de) : null;
  const fonte = (id: string | null) => data.fontes.find((f) => f.id === id)?.nome;
  const evs = [...data.evidencias]
    .filter((e) => !q || e.informacao.toLowerCase().includes(q.toLowerCase()))
    .sort((x, y) => Number(linked.has(y.id)) - Number(linked.has(x.id)));

  return (
    <Sheet open={!!achado} onOpenChange={(o) => { if (!o) { setDesc(null); setQ(""); onClose(); } }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {achado && (
          <>
            <SheetHeader>
              <SheetTitle>{achado.titulo}</SheetTitle>
              <SheetDescription>{ACHADO_LABEL[achado.tipo]}{origem && ` · deriva de: ${origem.titulo}`}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <label className="block space-y-1.5"><span className="text-[13px] font-medium">{achado.tipo === "gargalo_principal" ? "Por que este é o gargalo?" : "Descrição"}</span>
                <textarea rows={3} value={desc ?? achado.descricao ?? ""} onChange={(e) => setDesc(e.target.value)}
                  onBlur={() => desc !== null && a.update("estrategia_achados", achado.id, { descricao: desc || null })} className={inputCls} />
              </label>
              <div className="flex flex-wrap gap-2">
                {achado.tipo === "hipotese" && <>
                  <button className={btn} onClick={() => a.update("estrategia_achados", achado.id, { status: "validado" })}>Marcar como validada</button>
                  <button className={btn} onClick={() => a.update("estrategia_achados", achado.id, { status: "descartado" })}>Descartar</button>
                </>}
                {achado.tipo !== "decisao" && (
                  <button className={btnPrimary} onClick={async () => {
                    const { data: row, error } = await db("estrategia_achados").insert({ cliente_id: clienteId, etapa: 7, tipo: "decisao", titulo: achado.titulo, status: "aprovado", deriva_de: achado.id }).select("id").single();
                    if (error) { toast.error("Não foi possível criar a decisão."); return; }
                    if (linked.size) await db("estrategia_achado_evidencias").insert([...linked].map((evidencia_id) => ({ achado_id: row.id, evidencia_id, cliente_id: clienteId })));
                    if (achado.tipo === "hipotese") await a.update("estrategia_achados", achado.id, { status: "validado" });
                    a.refresh(); onClose();
                  }}>Transformar em decisão</button>
                )}
                <button className="text-[13px] text-destructive hover:underline" onClick={async () => { await a.remove("estrategia_achados", achado.id); onClose(); }}>Excluir</button>
              </div>
              <div>
                <div className="mb-2 text-[13px] font-medium">Evidências que sustentam ({linked.size})</div>
                {data.evidencias.length ? (
                  <>
                    <div className="relative mb-2">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar evidência" className={`${inputCls} h-8 py-1 pl-8`} />
                    </div>
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {evs.map((e) => (
                        <li key={e.id}>
                          <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-accent">
                            <input type="checkbox" className="mt-0.5" checked={linked.has(e.id)} onChange={(ev) => a.link(achado.id, e.id, ev.target.checked)} />
                            <span className="min-w-0">
                              <span className="block text-[13px] text-foreground">{e.informacao}</span>
                              <span className="text-xs text-muted-foreground">{[e.categoria ? CATEGORIA_LABEL[e.categoria] ?? e.categoria : "Sem categoria", fonte(e.fonte_id) && `Fonte: ${fonte(e.fonte_id)}`].filter(Boolean).join(" · ")}</span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : <Empty>Registre evidências na Pesquisa para vinculá-las aqui.</Empty>}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
