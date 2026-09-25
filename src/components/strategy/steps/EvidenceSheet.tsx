import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CATEGORIAS_POR_ETAPA, CATEGORIA_LABEL, STEPS } from "@/lib/strategy";
import { btn, btnPrimary, inputCls } from "../ui";
import type { Evidencia, Fonte } from "../useStrategy";

export type EvidenceDraft = { informacao: string; etapa: number | null; fonte_id: string | null; categoria: string | null; origem: string; data_ref: string; observacao: string };

/** Drawer to register or edit an evidence. Classification is always optional. */
export function EvidenceSheet({ open, onOpenChange, etapa, fontes, initial, onSave, onDelete }: {
  open: boolean; onOpenChange: (o: boolean) => void; etapa: number | null; fontes: Fonte[];
  initial?: Evidencia | null; onSave: (d: EvidenceDraft) => Promise<void>; onDelete?: () => Promise<void>;
}) {
  const blank: EvidenceDraft = { informacao: "", etapa, fonte_id: null, categoria: null, origem: "", data_ref: "", observacao: "" };
  const [d, setD] = useState<EvidenceDraft>(blank);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setD(initial ? {
      informacao: initial.informacao, etapa: initial.etapa, fonte_id: initial.fonte_id, categoria: initial.categoria,
      origem: initial.origem ?? "", data_ref: initial.data_ref ?? "", observacao: initial.observacao ?? "",
    } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  const cats = d.etapa ? CATEGORIAS_POR_ETAPA[d.etapa] ?? [] : Object.entries(CATEGORIA_LABEL).map(([key, label]) => ({ key, label }));
  const save = async () => { setBusy(true); try { await onSave(d); onOpenChange(false); } finally { setBusy(false); } };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{initial ? "Evidência" : "Nova evidência"}</SheetTitle>
          <SheetDescription>Informação observada ou coletada. Preserve a fonte original.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Conteúdo</span>
            <textarea rows={4} value={d.informacao} onChange={(e) => setD({ ...d, informacao: e.target.value })} className={inputCls} placeholder="Ex.: “Demorei para marcar porque não sabia o preço” — cliente em avaliação" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Etapa</span>
              <select value={d.etapa ?? ""} onChange={(e) => setD({ ...d, etapa: e.target.value ? Number(e.target.value) : null, categoria: null })} className={inputCls}>
                <option value="">—</option>
                {STEPS.slice(0, 7).map((s) => <option key={s.n} value={s.n}>{s.n}. {s.titulo}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Categoria <span className="font-normal text-muted-foreground">(opcional)</span></span>
              <select value={d.categoria ?? ""} onChange={(e) => setD({ ...d, categoria: e.target.value || null })} className={inputCls}>
                <option value="">Sem classificação</option>
                {cats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </label>
          </div>
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Fonte</span>
            <select value={d.fonte_id ?? ""} onChange={(e) => setD({ ...d, fonte_id: e.target.value || null })} className={inputCls}>
              <option value="">Sem fonte cadastrada</option>
              {fontes.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Origem</span>
              <input value={d.origem} onChange={(e) => setD({ ...d, origem: e.target.value })} className={inputCls} placeholder="Quem / onde" />
            </label>
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Data</span>
              <input type="date" value={d.data_ref} onChange={(e) => setD({ ...d, data_ref: e.target.value })} className={inputCls} />
            </label>
          </div>
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Observação</span>
            <textarea rows={2} value={d.observacao} onChange={(e) => setD({ ...d, observacao: e.target.value })} className={inputCls} />
          </label>
          <div className="flex items-center justify-between pt-2">
            {onDelete ? <button className="text-[13px] text-destructive hover:underline" onClick={async () => { await onDelete(); onOpenChange(false); }}>Excluir</button> : <span />}
            <div className="flex gap-2">
              <button className={btn} onClick={() => onOpenChange(false)}>Cancelar</button>
              <button className={btnPrimary} disabled={!d.informacao.trim() || busy} onClick={save}>Salvar evidência</button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const draftToRow = (d: EvidenceDraft) => ({
  informacao: d.informacao.trim(), etapa: d.etapa, fonte_id: d.fonte_id, categoria: d.categoria,
  origem: d.origem || null, data_ref: d.data_ref || null, observacao: d.observacao || null,
});
