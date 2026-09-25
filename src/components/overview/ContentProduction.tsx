export type ContentProductionCounts = {
  producao: number;
  revisao: number;
  comCliente: number;
  aprovados: number;
  publicados: number;
};

const STAGES: { key: keyof ContentProductionCounts; label: string }[] = [
  { key: "producao", label: "Em produção" },
  { key: "revisao", label: "Revisão" },
  { key: "comCliente", label: "Com cliente" },
  { key: "aprovados", label: "Aprovados" },
  { key: "publicados", label: "Publicados" },
];

/**
 * Content pipeline summary. `counts` stays undefined until the Conteúdo
 * module (Fase 5) provides real data — never filled with placeholders.
 */
export function ContentProduction({ counts }: { counts?: ContentProductionCounts }) {
  return (
    <div>
      <div className="grid grid-cols-3 divide-x divide-border sm:grid-cols-5">
        {STAGES.map((s) => (
          <div key={s.key} className="px-3 py-4">
            <div className="text-[12px] leading-tight text-muted-foreground">{s.label}</div>
            <div className={counts ? "mt-1 text-xl font-semibold text-foreground" : "mt-1 text-xl font-semibold text-text-tertiary"}>
              {counts ? counts[s.key] : "—"}
            </div>
          </div>
        ))}
      </div>
      {!counts && (
        <div className="border-t border-border px-5 py-3 text-[13px] text-muted-foreground">
          Os números aparecem quando o novo módulo Conteúdo estiver ativo.
        </div>
      )}
    </div>
  );
}
