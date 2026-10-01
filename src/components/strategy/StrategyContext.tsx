import type { StrategyData } from "./useStrategy";

const val = (data: StrategyData, etapa: number, campo: string) => data.definicoes.find((d) => d.etapa === etapa && d.campo === campo)?.valor?.trim() ?? "";

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

function contextFor(data: StrategyData, etapa: number) {
  const gargalo = data.achados.find((a) => a.tipo === "gargalo_principal" && a.status !== "descartado");
  const decisao = data.achados.find((a) => a.tipo === "decisao" && a.status !== "descartado");
  const pesquisa = [val(data, 3, "r3_dores"), val(data, 3, "r3_objecoes"), val(data, 3, "r3_linguagem"), val(data, 4, "r4_resumo"), val(data, 4, "r4_oportunidades"), val(data, 5, "c5_interpretacoes")].filter(Boolean).join("\n");
  const evidencias = val(data, 6, "e6_painel") || val(data, 6, "e6_sintese") || val(data, 6, "e6_hipoteses");
  const diagnostico = val(data, 7, "e7_problema_estrategico") || val(data, 7, "e7_veredito") || gargalo?.titulo || decisao?.titulo || "";
  const objetivo = val(data, 8, "objetivo") || data.legado?.objetivo || "";
  const publico = val(data, 9, "publico_prioritario");
  const jornada = [val(data, 9, "situacao"), val(data, 9, "jornada"), val(data, 9, "decisao_desejada")].filter(Boolean).join(" · ");
  const posicionamento = val(data, 10, "posicionamento_final") || val(data, 10, "territorio");
  const tese = val(data, 11, "tese_estrategica");
  const argumentos = val(data, 11, "argumentos");
  const mensagens = [val(data, 11, "mensagem_central"), val(data, 11, "mensagens_prioritarias")].filter(Boolean).join("\n");
  const provas = [val(data, 10, "razoes"), val(data, 11, "matriz_provas")].filter(Boolean).join("\n");
  const limites = [val(data, 10, "limites_posicionamento"), val(data, 11, "mensagens_proibidas"), val(data, 11, "limites")].filter(Boolean).join("\n");
  const editorial = val(data, 12, "e12_consolidado");

  const all = { pesquisa, evidencias, diagnostico, objetivo, publico, jornada, posicionamento, tese, argumentos, mensagens, provas, limites, editorial };
  const keys = etapa === 8 ? ["diagnostico"]
    : etapa === 9 ? ["diagnostico", "objetivo"]
    : etapa === 10 ? ["objetivo", "publico", "jornada"]
    : etapa === 11 ? ["objetivo", "publico", "posicionamento", "provas", "limites"]
    : etapa === 12 ? ["pesquisa", "evidencias", "diagnostico", "objetivo", "publico", "jornada", "posicionamento", "tese", "argumentos", "mensagens", "provas", "limites"]
    : etapa === 13 ? ["pesquisa", "evidencias", "diagnostico", "objetivo", "publico", "jornada", "posicionamento", "tese", "mensagens", "provas", "limites", "editorial"]
    : [];
  return keys.map((key) => ({ key, value: all[key as keyof typeof all] })).filter((x) => x.value);
}

export function StrategyContext({ data, etapa }: { data: StrategyData; etapa: number }) {
  const items = contextFor(data, etapa);
  if (!items.length) return null;
  return (
    <section className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="text-[13px] font-semibold text-foreground">Contexto herdado da estratégia</div>
      <p className="mt-0.5 text-xs text-muted-foreground">Estas informações vêm das etapas anteriores. Não precisam ser digitadas novamente; use-as como entrada para o prompt e para as decisões desta etapa.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.key} className="rounded-md border border-border bg-card px-3 py-2.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{LABELS[item.key]}</div>
            <div className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
