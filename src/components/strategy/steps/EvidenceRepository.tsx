import { AlertTriangle, CheckCircle2, Database, FileQuestion, Filter, Plus, Search, Scissors } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CATEGORIA_LABEL, EVIDENCIA_CATEGORIAS, STEPS } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { Block, Empty, btn, btnPrimary, inputCls } from "../ui";
import { useStrategyActions, type Evidencia } from "../useStrategy";
import { EvidenceSheet, draftToRow } from "./EvidenceSheet";
import { EvidenceRow } from "./EvidenceRow";
import { MethodArtifacts } from "./MethodArtifacts";

/** Etapa 6: organiza o conjunto antes de interpretar. Não cria diagnóstico aqui. */
export function EvidenceRepository({ data, clienteId, touch }: StepProps) {
  const a = useStrategyActions(clienteId);
  const [q, setQ] = useState("");
  const [etapa, setEtapa] = useState("");
  const [cat, setCat] = useState<string>("");
  const [classification, setClassification] = useState("");
  const [fonteId, setFonteId] = useState("");
  const [edit, setEdit] = useState<Evidencia | null>(null);
  const [open, setOpen] = useState(false);
  const [split, setSplit] = useState<Evidencia | null>(null);
  const [splitText, setSplitText] = useState("");
  const [splitBusy, setSplitBusy] = useState(false);

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
  const classifications = [...new Set(data.evidencias.map((e) => e.classificacao).filter(Boolean))].sort();
  const withoutCategory = counts.get("") ?? 0;
  const withoutSource = data.evidencias.filter((e) => !e.fonte_id).length;

  const list = data.evidencias.filter((e) =>
    (!q || `${e.informacao} ${e.origem ?? ""} ${e.observacao ?? ""}`.toLowerCase().includes(q.toLowerCase())) &&
    (!etapa || String(e.etapa ?? "") === etapa) &&
    (!classification || e.classificacao === classification) &&
    (!fonteId || (fonteId === "_none" ? !e.fonte_id : e.fonte_id === fonteId)) &&
    (cat === "" || (cat === "_none" ? !e.categoria : e.categoria === cat)));

  const chip = (k: string, label: string, n: number) => (
    <button key={k} onClick={() => setCat(cat === k ? "" : k)}
      className={cn("rounded-md px-2.5 py-1 text-[13px] transition-colors", cat === k ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
      {label} <span className="text-xs text-muted-foreground">{n}</span>
    </button>
  );

  const openSplit = (e: Evidencia) => { setSplit(e); setSplitText(e.informacao); };
  const splitParts = splitText.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const confirmSplit = async () => {
    if (!split || splitParts.length < 2 || splitBusy) return;
    setSplitBusy(true);
    try {
      for (const informacao of splitParts) {
        await a.insert("estrategia_evidencias", {
          id: crypto.randomUUID(), informacao, etapa: split.etapa, fonte_id: split.fonte_id, categoria: split.categoria,
          classificacao: split.classificacao, origem: split.origem, data_ref: split.data_ref, observacao: split.observacao,
        });
      }
      await a.remove("estrategia_evidencias", split.id);
      setSplit(null); setSplitText(""); touch();
    } finally { setSplitBusy(false); }
  };

  return (
    <div className="space-y-8">
      <MethodArtifacts etapa={6} data={data} clienteId={clienteId} substeps={[
        { key: "banco", title: "Banco", question: "Quais evidências confiáveis temos antes de interpretar?", fields: [
          { key: "e6_banco_sintese", label: "Síntese do banco", hint: "Principais evidências, cobertura e qualidade do material.", rows: 4 },
          { key: "e6_lacunas", label: "Lacunas de evidência", hint: "O que ainda precisa ser investigado?", rows: 4 },
        ]},
        { key: "convergencias", title: "Convergências e contradições", question: "O que se repete, se reforça ou entra em conflito entre as fontes?", fields: [
          { key: "e6_convergencias", label: "Convergências", hint: "Padrões sustentados por múltiplas evidências.", rows: 5 },
          { key: "e6_contradicoes", label: "Contradições", hint: "Evidências que apontam em direções diferentes e precisam ser explicadas.", rows: 5 },
        ]},
        { key: "hipoteses", title: "Hipóteses", question: "Quais explicações estratégicas emergem das evidências, sem tratá-las ainda como fatos?", fields: [
          { key: "e6_hipoteses", label: "Hipóteses estratégicas", hint: "Hipótese + evidências favoráveis/contrárias + força percebida.", rows: 6 },
          { key: "e6_hipoteses_prioridade", label: "Hipóteses prioritárias", hint: "Quais merecem seguir para validação no diagnóstico?", rows: 4 },
        ]},
        { key: "painel", title: "Painel final", question: "Qual é a leitura consolidada que deve alimentar o diagnóstico?", fields: [
          { key: "e6_painel", label: "Painel de evidências estratégicas", hint: "Temas, evidências mais fortes, confiança, contradições, hipóteses e lacunas.", rows: 8 },
        ]},
      ]} />
    <Block title="Banco de evidências" description="Organize o que foi aprendido antes de interpretar padrões e formular o diagnóstico."
      action={<button className={btnPrimary} onClick={() => { setEdit(null); setOpen(true); }}><Plus size={14} /> Evidência</button>}>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card px-3.5 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Database size={13} /> Evidências</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{data.evidencias.length}</div>
        </div>
        <div className={cn("rounded-lg border px-3.5 py-3", withoutCategory ? "border-amber-200 bg-amber-50/40" : "border-border bg-card")}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">{withoutCategory ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />} Sem categoria</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{withoutCategory}</div>
        </div>
        <div className={cn("rounded-lg border px-3.5 py-3", withoutSource ? "border-amber-200 bg-amber-50/40" : "border-border bg-card")}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><FileQuestion size={13} /> Sem fonte</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{withoutSource}</div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1 border-b border-border pb-3">
        {chip("", "Todas", data.evidencias.length)}
        {cats.map((k) => chip(k, CATEGORIA_LABEL[k] ?? k, counts.get(k) ?? 0))}
        {withoutCategory ? chip("_none", "Sem categoria", withoutCategory) : null}
      </div>

      <div className="mb-3 grid gap-2 lg:grid-cols-[minmax(220px,1fr)_180px_180px_200px]">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar evidências" className={`${inputCls} h-8 py-1 pl-8`} />
        </div>
        <select aria-label="Classificação" value={classification} onChange={(e) => setClassification(e.target.value)} className={`${inputCls} h-8 py-1`}>
          <option value="">Todas classificações</option>
          {classifications.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select aria-label="Etapa de origem" value={etapa} onChange={(e) => setEtapa(e.target.value)} className={`${inputCls} h-8 py-1`}>
          <option value="">Todas as etapas</option>
          {STEPS.slice(0, 7).map((s) => <option key={s.n} value={s.n}>{s.n}. {s.titulo}</option>)}
        </select>
        <select aria-label="Fonte" value={fonteId} onChange={(e) => setFonteId(e.target.value)} className={`${inputCls} h-8 py-1`}>
          <option value="">Todas as fontes</option><option value="_none">Sem fonte</option>
          {data.fontes.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </div>

      {(q || etapa || cat || classification || fonteId) && <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Filter size={11} /> {list.length} de {data.evidencias.length} evidências</span>
        <button className="hover:text-foreground" onClick={() => { setQ(""); setEtapa(""); setCat(""); setClassification(""); setFonteId(""); }}>Limpar filtros</button>
      </div>}

      {list.length ? (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {list.map((e) => (
            <EvidenceRow key={e.id} e={e} fontes={data.fontes} onOpen={() => { setEdit(e); setOpen(true); }} onSplit={() => openSplit(e)}
              onCategoryChange={async (categoria) => { await a.update("estrategia_evidencias", e.id, { categoria }); touch(); }}
              extra={usage.get(e.id) ? <span className="shrink-0 text-xs text-muted-foreground">sustenta {usage.get(e.id)}</span> : null} />
          ))}
        </div>
      ) : <Empty>{data.evidencias.length ? "Nenhuma evidência com esses filtros." : "Nenhuma evidência registrada. Comece pelas etapas de Pesquisa."}</Empty>}

      <EvidenceSheet open={open} onOpenChange={setOpen} etapa={edit?.etapa ?? 6} fontes={data.fontes} initial={edit}
        onSave={async (d, isNew) => { if (isNew) await a.insert("estrategia_evidencias", { id: d.id, ...draftToRow(d) }); else await a.update("estrategia_evidencias", d.id, draftToRow(d)); touch(); }}
        onDelete={edit ? async () => { await a.remove("estrategia_evidencias", edit.id); touch(); } : undefined} />

      <Dialog open={!!split} onOpenChange={(o) => { if (!o && !splitBusy) { setSplit(null); setSplitText(""); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Scissors size={17} /> Desmembrar evidência</DialogTitle>
            <DialogDescription>Separe evidências atômicas com uma linha em branco entre elas. Fonte, etapa, categoria e metadados serão preservados.</DialogDescription>
          </DialogHeader>
          <textarea rows={14} value={splitText} onChange={(e) => setSplitText(e.target.value)} className={cn(inputCls, "resize-y font-sans leading-relaxed")} />
          <div className="text-xs text-muted-foreground">{splitParts.length < 2 ? "Insira pelo menos uma linha em branco para criar duas evidências." : `${splitParts.length} evidências serão criadas. O registro original será substituído.`}</div>
          <DialogFooter>
            <button className={btn} disabled={splitBusy} onClick={() => { setSplit(null); setSplitText(""); }}>Cancelar</button>
            <button className={btnPrimary} disabled={splitParts.length < 2 || splitBusy} onClick={() => void confirmSplit()}>{splitBusy ? "Desmembrando…" : `Criar ${splitParts.length} evidências`}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Block>
    </div>
  );
}
