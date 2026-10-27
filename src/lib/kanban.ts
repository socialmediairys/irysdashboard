/**
 * Ordenação manual de cards (Sprints e Produção de Conteúdos).
 * Cada card tem `ordem` (número). Ao soltar um card entre dois vizinhos, só ele
 * recebe uma nova ordem — o ponto médio — evitando reescrever a coluna inteira e
 * reduzindo conflitos entre usuários movendo cards ao mesmo tempo.
 */
export const ORDEM_STEP = 1000;

export function ordemBetween(prev: number | null | undefined, next: number | null | undefined): number {
  const hasP = typeof prev === "number" && Number.isFinite(prev);
  const hasN = typeof next === "number" && Number.isFinite(next);
  if (hasP && hasN) return (prev! + next!) / 2;
  if (hasP) return prev! + ORDEM_STEP;
  if (hasN) return next! - ORDEM_STEP;
  return Date.now();
}

/**
 * Calcula a nova ordem de `id` ao ser solto na lista `target` (já ordenada, de destino)
 * na posição `index` (0 = topo). `target` pode conter o próprio card (mesma coluna).
 */
export function ordemForDrop<T extends { id: string; ordem: number }>(target: T[], id: string, index: number): number {
  const rest = target.filter((t) => t.id !== id);
  const i = Math.max(0, Math.min(index, rest.length));
  return ordemBetween(rest[i - 1]?.ordem, rest[i]?.ordem);
}

export const byOrdem = <T extends { ordem: number; created_at?: string }>(a: T, b: T) =>
  a.ordem - b.ordem || (a.created_at ?? "").localeCompare(b.created_at ?? "");

/**
 * Regras de arraste no fluxo de Produção. Decisões do cliente (aprovar / pedir alteração)
 * e o envio ao cliente (que cria versão) não podem ser feitos arrastando.
 */
const CLIENT_ONLY = ["com_cliente", "alteracao_solicitada", "aprovado"];
const POS_APROVACAO = ["agendado", "publicado"];

export function contentDragCheck(from: string, to: string): { ok: true } | { ok: false; reason: string } {
  if (from === to) return { ok: true };
  if (to === "com_cliente") return { ok: false, reason: "Para enviar ao cliente, use “Enviar ao cliente” no detalhe do conteúdo." };
  if (CLIENT_ONLY.includes(to)) return { ok: false, reason: "Essa etapa depende da avaliação do cliente." };
  if (POS_APROVACAO.includes(to) && !["aprovado", ...POS_APROVACAO].includes(from))
    return { ok: false, reason: "Só conteúdos aprovados podem ser agendados ou publicados." };
  return { ok: true };
}
