export const PIPELINE_ETAPAS = [
  "estrategia",
  "linha_editorial",
  "design",
  "copy",
  "metricas",
] as const;

export type PipelineEtapa = (typeof PIPELINE_ETAPAS)[number];

export const PIPELINE_STATUS = [
  "nao_iniciado",
  "em_andamento",
  "concluido",
  "travado",
] as const;

export type PipelineStatusValor = (typeof PIPELINE_STATUS)[number];

export type PipelineStatusRow = {
  id: string;
  cliente_id: string;
  mes: string;
  etapa: PipelineEtapa;
  status: PipelineStatusValor;
};

export const ETAPA_LABEL: Record<PipelineEtapa, string> = {
  estrategia: "Estratégia",
  linha_editorial: "Linha editorial",
  design: "Design",
  copy: "Copy",
  metricas: "Métricas",
};

export const STATUS_LABEL: Record<PipelineStatusValor, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  travado: "Travado",
};

/** Cores semânticas: verde / âmbar / cinza / vermelho */
export const STATUS_STYLE: Record<
  PipelineStatusValor,
  { bg: string; fg: string; border: string }
> = {
  concluido: {
    bg: "color-mix(in oklab, var(--success, oklch(0.62 0.13 150)) 16%, var(--card))",
    fg: "var(--success, oklch(0.42 0.11 150))",
    border: "color-mix(in oklab, var(--success, oklch(0.62 0.13 150)) 40%, var(--border))",
  },
  em_andamento: {
    bg: "color-mix(in oklab, var(--warning, oklch(0.78 0.14 80)) 20%, var(--card))",
    fg: "oklch(0.42 0.1 70)",
    border: "color-mix(in oklab, var(--warning, oklch(0.78 0.14 80)) 45%, var(--border))",
  },
  nao_iniciado: {
    bg: "var(--muted)",
    fg: "var(--muted-foreground)",
    border: "var(--border)",
  },
  travado: {
    bg: "color-mix(in oklab, var(--destructive) 14%, var(--card))",
    fg: "var(--destructive)",
    border: "color-mix(in oklab, var(--destructive) 40%, var(--border))",
  },
};

/** Primeiro dia do mês atual em formato date (YYYY-MM-01). */
export function currentMes(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function mesLabel(mes: string): string {
  const [y, m] = mes.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}
