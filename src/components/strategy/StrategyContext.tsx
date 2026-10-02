import type { StrategyData } from "./useStrategy";

const val = (data: StrategyData, etapa: number, campo: string) =>
  data.definicoes.find((d) => d.etapa === etapa && d.campo === campo)?.valor?.trim() ?? "";

const LABELS: Record<string, string> = {
  pesquisa: "Pesquisa consolidada",
  evidencias: "Painel de evidências",
  diagnostico: "Diagnóstico / gargalo",
  objetivo: "Objetivo estratégico",
  publico: "Público prioritário",
  jornada: "Jornada / decisão",
  posicionamento: "Posicionamento",
  tese: "Tese estratégica",
  argumentos: "Argumentos",
  mensagens: "Mensagens prioritárias",
  provas: "Provas / razões para acreditar",
  limites: "Limites da comunicação",
  editorial: "Sistema editorial consolidado",
};

const SOURCE_STAGE: Record<string, number> = {
  pesquisa: 3,
  evidencias: 6,
  diagnostico: 7,
  objetivo: 8,
  publico: 9,
  jornada: 9,
  posicionamento: 10,
  tese: 11,
  argumentos: 11,
  mensagens: 11,
  provas: 11,
  limites: 11,
  editorial: 12,
};

const GROUPS = [
  { id: "direcao", label: "Direção", keys: ["diagnostico", "objetivo", "publico", "jornada"] },
  { id: "posicao", label: "Posição", keys: ["posicionamento", "tese"] },
  { id: "comunicacao", label: "Comunicação", keys: ["pesquisa", "evidencias", "argumentos", "mensagens", "provas", "limites"] },
  { id: "execucao", label: "Execução", keys: ["editorial"] },
];

function contextFor(data: StrategyData, etapa: number) {
  const gargalo = data.achados.find((a) => a.tipo === "gargalo_principal" && a.status !== "descartado");
  const decisao = data.achados.find((a) => a.tipo === "decisao" && a.status !== "descartado");

  const pesquisa = [
    val(data, 3, "r3_dores"),
    val(data, 3, "r3_objecoes"),
    val(data, 3, "r3_linguagem"),
    val(data, 4, "r4_resumo"),
    val(data, 4, "r4_oportunidades"),
    val(data, 5, "c5_interpretacoes"),
  ].filter(Boolean).join("\n");

  const evidencias =
    val(data, 6, "e6_painel") ||
    val(data, 6, "e6_sintese") ||
    val(data, 6, "e6_hipoteses");

  const diagnostico =
    val(data, 7, "e7_problema_estrategico") ||
    val(data, 7, "e7_veredito") ||
    gargalo?.titulo ||
    decisao?.titulo ||
    "";

  const objetivo = val(data, 8, "objetivo") || data.legado?.objetivo || "";
  const publico = val(data, 9, "publico_prioritario");
  const jornada = [
    val(data, 9, "situacao"),
    val(data, 9, "jornada"),
    val(data, 9, "decisao_desejada"),
  ].filter(Boolean).join(" · ");

  const posicionamento =
    val(data, 10, "posicionamento_final") ||
    val(data, 10, "territorio");

  const tese = val(data, 11, "tese_estrategica");
  const argumentos = val(data, 11, "argumentos");
  const mensagens = [
    val(data, 11, "mensagem_central"),
    val(data, 11, "mensagens_prioritarias"),
  ].filter(Boolean).join("\n");

  const provas = [
    val(data, 10, "razoes"),
    val(data, 11, "matriz_provas"),
  ].filter(Boolean).join("\n");

  const limites = [
    val(data, 10, "limites_posicionamento"),
    val(data, 11, "mensagens_proibidas"),
    val(data, 11, "limites"),
  ].filter(Boolean).join("\n");

  const editorial = val(data, 12, "e12_consolidado");

  const all = {
    pesquisa,
    evidencias,
    diagnostico,
    objetivo,
    publico,
    jornada,
    posicionamento,
    tese,
    argumentos,
    mensagens,
    provas,
    limites,
    editorial,
  };

  // Dependências metodológicas: mostramos também o que ainda falta,
  // em vez de esconder campos vazios e dar a impressão de que a etapa pode avançar.
  const keys =
    etapa === 8 ? ["diagnostico"]
    : etapa === 9 ? ["pesquisa", "evidencias", "diagnostico", "objetivo"]
    : etapa === 10 ? ["pesquisa", "evidencias", "objetivo", "publico", "jornada"]
    : etapa === 11 ? ["objetivo", "publico", "jornada", "posicionamento", "provas", "limites"]
    : etapa === 12 ? ["pesquisa", "evidencias", "diagnostico", "objetivo", "publico", "jornada", "posicionamento", "tese", "argumentos", "mensagens", "provas", "limites"]
    : etapa === 13 ? ["pesquisa", "evidencias", "diagnostico", "objetivo", "publico", "jornada", "posicionamento", "tese", "argumentos", "mensagens", "provas", "limites", "editorial"]
    : [];

  return keys.map((key) => ({
    key,
    value: all[key as keyof typeof all],
    sourceStage: SOURCE_STAGE[key],
  }));
}

function ContextCard({
  item,
}: {
  item: { key: string; value: string; sourceStage: number };
}) {
  const complete = Boolean(item.value);

  return (
    <div
      className={
        complete
          ? "rounded-md border border-border bg-card px-3 py-2.5"
          : "rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {LABELS[item.key]}
        </div>
        <span
          className={
            complete
              ? "shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
              : "shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700"
          }
        >
          {complete ? "Disponível" : `Pendente · Etapa ${item.sourceStage}`}
        </span>
      </div>

      {complete ? (
        <div className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
          {item.value}
        </div>
      ) : (
        <div className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Este insumo ainda não foi consolidado na etapa de origem. Complete-o antes de fechar esta decisão estratégica.
        </div>
      )}
    </div>
  );
}

export function StrategyContext({ data, etapa }: { data: StrategyData; etapa: number }) {
  const items = contextFor(data, etapa);
  if (!items.length) return null;

  const grouped = etapa >= 12;

  return (
    <section className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="text-[13px] font-semibold text-foreground">
        Contexto herdado da estratégia
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Estas informações vêm das etapas anteriores. Não precisam ser digitadas novamente; use-as como entrada para o prompt e para as decisões desta etapa. Itens pendentes indicam dependências ainda não consolidadas.
      </p>

      {grouped ? (
        <div className="mt-4 space-y-4">
          {GROUPS.map((group) => {
            const groupItems = items.filter((item) => group.keys.includes(item.key));
            if (!groupItems.length) return null;

            return (
              <div key={group.id}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {groupItems.map((item) => (
                    <ContextCard key={item.key} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <ContextCard key={item.key} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
