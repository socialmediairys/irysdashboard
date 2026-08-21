import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "primary";

const VARIANTS: Record<StatusVariant, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info",
  neutral: "bg-secondary text-muted-foreground",
  primary: "bg-primary-soft text-accent-foreground",
};

/**
 * Status → variant + label map for the PT-BR statuses used across the app.
 * Extend here instead of hardcoding colors in screens.
 */
export const STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  // contratos / clientes
  ativo: { label: "Ativo", variant: "success" },
  pendente_assinatura: { label: "Pendente de assinatura", variant: "warning" },
  vencido: { label: "Vencido", variant: "danger" },
  cancelado: { label: "Cancelado", variant: "neutral" },
  inativo: { label: "Inativo", variant: "neutral" },
  // financeiro
  pago: { label: "Pago", variant: "success" },
  pendente: { label: "Pendente", variant: "warning" },
  atrasado: { label: "Atrasado", variant: "danger" },
  // tarefas / sprints
  todo: { label: "A fazer", variant: "neutral" },
  doing: { label: "Em andamento", variant: "info" },
  em_andamento: { label: "Em andamento", variant: "info" },
  review: { label: "Em revisão", variant: "primary" },
  done: { label: "Concluído", variant: "success" },
  concluido: { label: "Concluído", variant: "success" },
  bloqueado: { label: "Bloqueado", variant: "danger" },
  // prioridade
  baixa: { label: "Baixa", variant: "neutral" },
  media: { label: "Média", variant: "info" },
  alta: { label: "Alta", variant: "warning" },
  alta_urgente: { label: "Urgente", variant: "danger" },
  // suporte
  aberto: { label: "Aberto", variant: "warning" },
  em_analise: { label: "Em análise", variant: "info" },
  resolvido: { label: "Resolvido", variant: "success" },
  // cadastro
  aprovado: { label: "Aprovado", variant: "success" },
  recusado: { label: "Recusado", variant: "danger" },
};

export function StatusBadge({
  status,
  variant,
  children,
  className,
  dot = true,
}: {
  /** Raw status value; resolved through STATUS_MAP for label + color. */
  status?: string | null;
  /** Explicit override when the value is not in STATUS_MAP. */
  variant?: StatusVariant;
  children?: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  const mapped = status ? STATUS_MAP[status] : undefined;
  const v = variant ?? mapped?.variant ?? "neutral";
  const label = children ?? mapped?.label ?? status ?? "—";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        VARIANTS[v],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {label}
    </span>
  );
}
