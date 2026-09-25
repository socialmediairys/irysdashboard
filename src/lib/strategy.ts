/** Metodologia estratégica IRYS — definição das 13 etapas e estruturas de apoio. */
import type { StatusVariant } from "@/components/ui/status-badge";

export type EtapaStatus = "nao_iniciada" | "em_andamento" | "revisar" | "concluida";
export type Macro = "investigar" | "diagnosticar" | "definir" | "executar";
export type SectionKey = "visao" | "pesquisa" | "diagnostico" | "direcionamento" | "editorial";

export type StepKind = "briefing" | "fontes" | "consumidor" | "mercado" | "concorrencia" | "evidencias" | "diagnostico" | "definicao" | "editorial" | "calendario";

export type StepDef = { n: number; titulo: string; macro: Macro; section: SectionKey; kind: StepKind; acao: string };

export const STEPS: StepDef[] = [
  { n: 1, titulo: "Briefing Estratégico", macro: "investigar", section: "pesquisa", kind: "briefing", acao: "Registrar o que se sabe e o que ainda é desconhecido sobre o negócio." },
  { n: 2, titulo: "Pesquisa da Empresa", macro: "investigar", section: "pesquisa", kind: "fontes", acao: "Mapear fontes da empresa e registrar evidências observadas." },
  { n: 3, titulo: "Pesquisa do Consumidor", macro: "investigar", section: "pesquisa", kind: "consumidor", acao: "Coletar a voz do cliente: dores, desejos, objeções e linguagem." },
  { n: 4, titulo: "Pesquisa de Mercado", macro: "investigar", section: "pesquisa", kind: "mercado", acao: "Registrar contexto, tendências, oportunidades e ameaças com fonte." },
  { n: 5, titulo: "Pesquisa da Concorrência", macro: "investigar", section: "pesquisa", kind: "concorrencia", acao: "Cadastrar concorrentes e comparar posicionamento e oferta." },
  { n: 6, titulo: "Organização das Evidências", macro: "diagnosticar", section: "diagnostico", kind: "evidencias", acao: "Revisar e categorizar todas as evidências coletadas." },
  { n: 7, titulo: "Diagnóstico e Gargalo", macro: "diagnosticar", section: "diagnostico", kind: "diagnostico", acao: "Identificar padrões, formular hipóteses e definir o gargalo principal." },
  { n: 8, titulo: "Objetivo Estratégico", macro: "definir", section: "direcionamento", kind: "definicao", acao: "Definir objetivo, mudança desejada e critério de sucesso." },
  { n: 9, titulo: "Público-Alvo", macro: "definir", section: "direcionamento", kind: "definicao", acao: "Descrever segmentos, dores, desejos e jornada." },
  { n: 10, titulo: "Posicionamento", macro: "definir", section: "direcionamento", kind: "definicao", acao: "Definir território, diferenciação, promessa e provas." },
  { n: 11, titulo: "Narrativa da Marca", macro: "definir", section: "direcionamento", kind: "definicao", acao: "Definir mensagens centrais, argumentos e limites de comunicação." },
  { n: 12, titulo: "Sistema Editorial", macro: "executar", section: "editorial", kind: "editorial", acao: "Estruturar pilares, temas, mensagens e argumentos." },
  { n: 13, titulo: "Calendário Estratégico", macro: "executar", section: "editorial", kind: "calendario", acao: "Planejar itens por data ligados ao sistema editorial." },
];

export const stepByN = (n: number) => STEPS.find((s) => s.n === n)!;

export const MACROS: { key: Macro; label: string }[] = [
  { key: "investigar", label: "Investigar" },
  { key: "diagnosticar", label: "Diagnosticar" },
  { key: "definir", label: "Definir estratégia" },
  { key: "executar", label: "Executar" },
];

export const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "visao", label: "Visão geral" },
  { key: "pesquisa", label: "Pesquisa" },
  { key: "diagnostico", label: "Diagnóstico" },
  { key: "direcionamento", label: "Direcionamento" },
  { key: "editorial", label: "Plano editorial" },
];

export const STATUS_LABEL: Record<EtapaStatus, string> = {
  nao_iniciada: "Não iniciada", em_andamento: "Em andamento", revisar: "Revisar", concluida: "Concluída",
};
export const STATUS_VARIANT: Record<EtapaStatus, StatusVariant> = {
  nao_iniciada: "neutral", em_andamento: "info", revisar: "warning", concluida: "success",
};

/* ---------- Briefing ---------- */
export type BriefingStatus = "completa" | "incompleta" | "desconhecida";
export type BriefingAnswer = { valor?: string; status?: BriefingStatus };
export type BriefingMapa = Record<string, BriefingAnswer>;

export const BRIEFING_AREAS: { key: string; label: string; perguntas: { key: string; label: string }[] }[] = [
  { key: "negocio", label: "Negócio", perguntas: [
    { key: "negocio_oferta", label: "O que a empresa vende e como entrega" },
    { key: "negocio_modelo", label: "Modelo de receita e ticket médio" },
    { key: "negocio_historia", label: "História e momento atual" },
    { key: "negocio_diferencial", label: "Diferencial percebido pela própria empresa" },
  ] },
  { key: "cliente", label: "Cliente", perguntas: [
    { key: "cliente_quem", label: "Quem compra hoje" },
    { key: "cliente_motivo", label: "Por que compram" },
    { key: "cliente_objecoes", label: "Principais objeções conhecidas" },
  ] },
  { key: "mercado", label: "Mercado", perguntas: [
    { key: "mercado_contexto", label: "Contexto e sazonalidade" },
    { key: "mercado_concorrentes", label: "Concorrentes conhecidos" },
  ] },
  { key: "comercial", label: "Comercial", perguntas: [
    { key: "comercial_processo", label: "Como a venda acontece" },
    { key: "comercial_gargalo", label: "Onde a venda trava" },
    { key: "comercial_metas", label: "Metas comerciais" },
  ] },
  { key: "marketing", label: "Marketing", perguntas: [
    { key: "marketing_canais", label: "Canais usados e resultados" },
    { key: "marketing_historico", label: "O que já foi testado" },
    { key: "marketing_recursos", label: "Recursos disponíveis (equipe, verba, tempo)" },
  ] },
];
export const BRIEFING_TOTAL = BRIEFING_AREAS.reduce((a, b) => a + b.perguntas.length, 0);

/** Score objetivo: proporção de perguntas marcadas como completas. Sem avaliação = não conta. */
export function briefingScore(mapa: BriefingMapa) {
  let completas = 0, incompletas = 0, desconhecidas = 0;
  for (const a of BRIEFING_AREAS) for (const p of a.perguntas) {
    const s = mapa[p.key]?.status;
    if (s === "completa") completas++; else if (s === "incompleta") incompletas++; else if (s === "desconhecida") desconhecidas++;
  }
  const avaliadas = completas + incompletas + desconhecidas;
  return { completas, incompletas, desconhecidas, avaliadas, total: BRIEFING_TOTAL };
}

/* ---------- Definições (etapas 8–11) ---------- */
export const DEFINICAO_CAMPOS: Record<number, { key: string; label: string; hint?: string }[]> = {
  8: [
    { key: "objetivo", label: "Objetivo" },
    { key: "mudanca", label: "Mudança desejada", hint: "De onde para onde" },
    { key: "indicadores", label: "Indicadores" },
    { key: "prazo", label: "Prazo" },
    { key: "criterio", label: "Critério de sucesso" },
  ],
  9: [
    { key: "segmentos", label: "Segmentos" },
    { key: "dores", label: "Dores" },
    { key: "desejos", label: "Desejos" },
    { key: "objecoes", label: "Objeções" },
    { key: "contexto", label: "Contexto" },
    { key: "jornada", label: "Jornada" },
    { key: "comportamentos", label: "Comportamentos relevantes" },
    { key: "persona", label: "Persona (opcional)", hint: "Não é obrigatório criar persona" },
  ],
  10: [
    { key: "territorio", label: "Território" },
    { key: "diferenciacao", label: "Diferenciação" },
    { key: "promessa", label: "Promessa" },
    { key: "provas", label: "Provas" },
    { key: "alternativas", label: "Alternativas concorrentes" },
    { key: "razoes", label: "Razões para acreditar" },
  ],
  11: [
    { key: "mensagens", label: "Mensagens centrais" },
    { key: "temas", label: "Temas" },
    { key: "argumentos", label: "Argumentos" },
    { key: "provas", label: "Provas" },
    { key: "tensoes", label: "Tensões" },
    { key: "linguagem", label: "Linguagem" },
    { key: "limites", label: "Limites de comunicação" },
  ],
};

/* ---------- Evidências, fontes, achados ---------- */
export const FONTE_TIPOS = ["site", "instagram", "google_business", "documento", "material_institucional", "link", "upload", "entrevista", "formulario", "avaliacao", "comentario", "whatsapp", "dm", "pesquisa", "outro"] as const;
export const FONTE_TIPO_LABEL: Record<string, string> = {
  site: "Site", instagram: "Instagram", google_business: "Google Business", documento: "Documento", material_institucional: "Material institucional",
  link: "Link", upload: "Upload", entrevista: "Entrevista", formulario: "Formulário", avaliacao: "Avaliação", comentario: "Comentário",
  whatsapp: "WhatsApp", dm: "DM", pesquisa: "Pesquisa", outro: "Outra fonte",
};
export const FONTES_POR_ETAPA: Record<number, readonly string[]> = {
  2: ["site", "instagram", "google_business", "documento", "material_institucional", "link", "upload", "outro"],
  3: ["entrevista", "formulario", "avaliacao", "comentario", "whatsapp", "dm", "pesquisa", "outro"],
  4: ["link", "documento", "pesquisa", "outro"],
};
export const FONTE_STATUS_LABEL: Record<string, string> = { a_analisar: "A analisar", em_analise: "Em análise", analisada: "Analisada" };

export const CATEGORIAS_POR_ETAPA: Record<number, { key: string; label: string }[]> = {
  3: [
    { key: "dor", label: "Dor" }, { key: "desejo", label: "Desejo" }, { key: "objecao", label: "Objeção" },
    { key: "linguagem", label: "Linguagem utilizada" }, { key: "necessidade", label: "Necessidade" }, { key: "contexto", label: "Contexto" },
  ],
  4: [
    { key: "contexto", label: "Contexto" }, { key: "tendencia", label: "Tendência" }, { key: "comportamento", label: "Comportamento" },
    { key: "oportunidade", label: "Oportunidade" }, { key: "ameaca", label: "Ameaça" },
  ],
};
export const CATEGORIA_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(CATEGORIAS_POR_ETAPA).flat().map((c) => [c.key, c.label]),
);

export type AchadoTipo = "padrao" | "tensao" | "problema" | "oportunidade" | "hipotese" | "gargalo_principal" | "gargalo_secundario" | "decisao";
export const ACHADO_LABEL: Record<AchadoTipo, string> = {
  padrao: "Padrão", tensao: "Tensão", problema: "Problema", oportunidade: "Oportunidade", hipotese: "Hipótese",
  gargalo_principal: "Gargalo principal", gargalo_secundario: "Gargalo secundário", decisao: "Decisão",
};

export const CONCORRENTE_CAMPOS = [
  { key: "posicionamento", label: "Posicionamento" }, { key: "oferta", label: "Oferta" }, { key: "preco", label: "Preço" },
  { key: "comunicacao", label: "Comunicação" }, { key: "conteudo", label: "Conteúdo" }, { key: "provas", label: "Provas" },
  { key: "diferenciais", label: "Diferenciais" }, { key: "oportunidades", label: "Oportunidades" },
] as const;

export const JORNADA_OPCOES = ["Descoberta", "Consideração", "Decisão", "Pós-compra"];

/* ---------- Progresso ---------- */
export type EtapaRow = { etapa: number; status: EtapaStatus; iniciado_em: string | null; concluido_em: string | null; updated_at: string };

export function strategyProgress(rows: EtapaRow[]) {
  const map = new Map(rows.map((r) => [r.etapa, r]));
  const concluidas = STEPS.filter((s) => map.get(s.n)?.status === "concluida").length;
  const atual = STEPS.find((s) => map.get(s.n)?.status !== "concluida") ?? null;
  const last = rows.reduce<string | null>((a, r) => (!a || r.updated_at > a ? r.updated_at : a), null);
  return { concluidas, pct: Math.round((concluidas / STEPS.length) * 100), atual, last, map, iniciada: rows.some((r) => r.status !== "nao_iniciada") };
}
