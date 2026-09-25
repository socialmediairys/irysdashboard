/** Client workspace tabs + legacy tab aliases (old profile URLs keep working). */
export const CLIENT_TABS = [
  { key: "visao-geral", label: "Visão geral" },
  { key: "estrategia", label: "Estratégia" },
  { key: "conteudos", label: "Conteúdos" },
  { key: "planejamento", label: "Planejamento" },
  { key: "metricas", label: "Métricas" },
  { key: "arquivos", label: "Arquivos" },
  { key: "financeiro", label: "Financeiro" },
  { key: "portal", label: "Portal" },
] as const;

export type ClientTabKey = (typeof CLIENT_TABS)[number]["key"];

const LEGACY: Record<string, ClientTabKey> = {
  dados: "visao-geral",
  pipeline: "planejamento",
  gerenciar: "portal",
  preview: "portal",
  cobranca: "financeiro",
};

export function parseClientTab(v: unknown): ClientTabKey {
  if (typeof v !== "string") return "visao-geral";
  if (CLIENT_TABS.some((t) => t.key === v)) return v as ClientTabKey;
  return LEGACY[v] ?? "visao-geral";
}

/** Maps DB contract status + onboarding into the list filter groups. */
export type ClientGroup = "ativo" | "onboarding" | "pausado";
export function clientGroup(status: string, onboardingPendente: number): ClientGroup {
  if (status === "vencido" || status === "cancelado") return "pausado";
  if (status === "pendente_assinatura" || onboardingPendente > 0) return "onboarding";
  return "ativo";
}
export const GROUP_LABEL: Record<ClientGroup, string> = {
  ativo: "Ativo",
  onboarding: "Onboarding",
  pausado: "Pausado",
};
export const CONTRATO_LABEL: Record<string, string> = {
  ativo: "Contrato ativo",
  pendente_assinatura: "Aguardando assinatura",
  vencido: "Contrato vencido",
  cancelado: "Cancelado",
};
