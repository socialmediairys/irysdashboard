import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { JORNADA_OPCOES } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { Block, Empty, btn, btnPrimary, inputCls } from "../ui";
import { useStrategyActions } from "../useStrategy";

const CANAIS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Blog", "E-mail", "WhatsApp"];
const FORMATOS = ["Reels", "Carrossel", "Story", "Post", "Vídeo", "Live"];
const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Planejamento estratégico por mês. Itens referenciam o Sistema Editorial (não duplicam texto). */
export function CalendarStep({ data, clienteId, touch }: StepProps) {
  const a = useStrategyActions(clienteId);
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const blank = { data: "", titulo: "", canal: "Instagram", formato: "", pilar_id: "", tema_id: "", mensagem_id: "", argumento_id: "", jornada: "", objetivo: "", cta: "" };
  const [f, setF] = useState(blank);
  const [adding, setAdding] = useState(false);
  const items = data.calendario.filter((i) => i.data.startsWith(ym(mes)));
  const nome = (arr: { id: string }[], id: string | null, k: string) => (arr.find((x) => x.id === id) as Record<string, string> | undefined)?.[k];

  const temas = data.temas.filter((t) => !f.pilar_id || t.pilar_id === f.pilar_id);
  const msgs = data.mensagens.filter((m) => !f.tema_id || m.tema_id === f.tema_id);
  const args = data.argumentos.filter((x) => !f.mensagem_id || x.mensagem_id === f.mensagem_id);
  const onMsg = (id: string) => {
    const m = data.mensagens.find((x) => x.id === id);
    setF({ ...f, mensagem_id: id, argumento_id: "", jornada: m?.jornada ?? f.jornada, cta: m?.cta ?? f.cta, objetivo: m?.objetivo_psicologico ?? f.objetivo });
  };
  const save = async () => {
    const n = (v: string) => v || null;
    await a.insert("calendario_estrategico_itens", { data: f.data, titulo: n(f.titulo), canal: n(f.canal), formato: n(f.formato), pilar_id: n(f.pilar_id), tema_id: n(f.tema_id), mensagem_id: n(f.mensagem_id), argumento_id: n(f.argumento_id), jornada: n(f.jornada), objetivo: n(f.objetivo), cta: n(f.cta) });
    setF(blank); setAdding(false); touch();
  };
  const sel = `${inputCls} h-8 py-1 text-[13px]`;

  return (
    <Block title="Calendário estratégico" description="Itens planejados. Na Fase 5 eles poderão originar conteúdos em produção."
      action={
        <div className="flex items-center gap-2">
          <button className={btn} onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} aria-label="Mês anterior"><ChevronLeft size={14} /></button>
          <span className="w-32 text-center text-[13px] font-medium capitalize">{mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
          <button className={btn} onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} aria-label="Próximo mês"><ChevronRight size={14} /></button>
          <button className={btnPrimary} onClick={() => setAdding(true)}><Plus size={14} /> Item</button>
        </div>
      }>
      {adding && (
        <div className="mb-4 space-y-3 rounded-lg border border-border bg-card p-4">
          {!data.pilares.length && <p className="text-xs text-muted-foreground">Dica: estruture o Sistema Editorial (etapa 12) para vincular pilar, tema e mensagem.</p>}
          <div className="grid gap-2 sm:grid-cols-4">
            <input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} className={sel} aria-label="Data" />
            <input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Título (opcional)" className={`${sel} sm:col-span-3`} />
            <select value={f.canal} onChange={(e) => setF({ ...f, canal: e.target.value })} className={sel} aria-label="Canal">{CANAIS.map((c) => <option key={c}>{c}</option>)}</select>
            <select value={f.formato} onChange={(e) => setF({ ...f, formato: e.target.value })} className={sel} aria-label="Formato"><option value="">Formato</option>{FORMATOS.map((c) => <option key={c}>{c}</option>)}</select>
            <select value={f.pilar_id} onChange={(e) => setF({ ...f, pilar_id: e.target.value, tema_id: "", mensagem_id: "", argumento_id: "" })} className={sel} aria-label="Pilar"><option value="">Pilar</option>{data.pilares.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
            <select value={f.tema_id} onChange={(e) => setF({ ...f, tema_id: e.target.value, mensagem_id: "", argumento_id: "" })} className={sel} aria-label="Tema"><option value="">Tema</option>{temas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
            <select value={f.mensagem_id} onChange={(e) => onMsg(e.target.value)} className={`${sel} sm:col-span-2`} aria-label="Mensagem"><option value="">Mensagem</option>{msgs.map((p) => <option key={p.id} value={p.id}>{p.mensagem}</option>)}</select>
            <select value={f.argumento_id} onChange={(e) => setF({ ...f, argumento_id: e.target.value })} className={`${sel} sm:col-span-2`} aria-label="Argumento"><option value="">Argumento / prova</option>{args.map((p) => <option key={p.id} value={p.id}>{p.argumento}</option>)}</select>
            <select value={f.jornada} onChange={(e) => setF({ ...f, jornada: e.target.value })} className={sel} aria-label="Jornada"><option value="">Jornada</option>{JORNADA_OPCOES.map((j) => <option key={j}>{j}</option>)}</select>
            <input value={f.objetivo} onChange={(e) => setF({ ...f, objetivo: e.target.value })} placeholder="Objetivo" className={sel} />
            <input value={f.cta} onChange={(e) => setF({ ...f, cta: e.target.value })} placeholder="CTA" className={`${sel} sm:col-span-2`} />
          </div>
          <div className="flex justify-end gap-2">
            <button className={btn} onClick={() => setAdding(false)}>Cancelar</button>
            <button className={btnPrimary} disabled={!f.data} onClick={save}>Salvar item</button>
          </div>
        </div>
      )}
      {items.length ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              {["Data", "Canal · formato", "Pilar → tema", "Mensagem", "Jornada", "CTA", ""].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="px-3 py-2.5 text-foreground">{new Date(`${i.data}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{[i.canal, i.formato].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{[nome(data.pilares, i.pilar_id, "nome"), nome(data.temas, i.tema_id, "nome")].filter(Boolean).join(" → ") || "—"}</td>
                  <td className="max-w-xs px-3 py-2.5 text-foreground">{i.titulo || nome(data.mensagens, i.mensagem_id, "mensagem") || "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{i.jornada ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{i.cta ?? "—"}</td>
                  <td className="px-3 py-2.5"><button onClick={() => a.remove("calendario_estrategico_itens", i.id)} className="text-muted-foreground hover:text-destructive" aria-label="Excluir item"><Trash2 size={13} strokeWidth={1.6} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty>Nenhum item planejado neste mês.</Empty>}
    </Block>
  );
}
