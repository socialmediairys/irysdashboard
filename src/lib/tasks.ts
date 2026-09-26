import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Status canônicos (coluna do Kanban = status real da tarefa). */
export const TASK_STATUS = [
  { key: "not_started", label: "A Fazer" },
  { key: "in_progress", label: "Em Andamento" },
  { key: "in_review", label: "Em Revisão" },
  { key: "done", label: "Concluído" },
] as const;
export type TaskStatus = (typeof TASK_STATUS)[number]["key"];

export function normalizeStatus(s: string | null | undefined): TaskStatus {
  const v = (s ?? "").toLowerCase();
  if (["in_progress", "em_andamento", "doing"].includes(v)) return "in_progress";
  if (["in_review", "em_revisao", "em_revisão", "review", "revisao"].includes(v)) return "in_review";
  if (["done", "concluida", "concluído", "concluido"].includes(v)) return "done";
  return "not_started";
}
export const statusLabel = (s: string | null | undefined) =>
  TASK_STATUS.find((x) => x.key === normalizeStatus(s))!.label;

export const PRIORITIES = [
  { key: "low", label: "Baixa" },
  { key: "medium", label: "Média" },
  { key: "high", label: "Alta" },
] as const;
export function normalizePriority(p: string | null | undefined): "high" | "medium" | "low" {
  const v = (p ?? "").toLowerCase();
  if (["high", "alta", "urgente"].includes(v)) return "high";
  if (["low", "baixa"].includes(v)) return "low";
  return "medium";
}
export const priorityLabel = (p: string | null | undefined) =>
  PRIORITIES.find((x) => x.key === normalizePriority(p))!.label;

/** Duração legível: 1h 42min / 30min / 0min */
export function fmtDuration(total: number | null | undefined) {
  const t = Math.max(0, Math.round(total ?? 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  if (h && m) return `${h}h ${m}min`;
  if (h) return `${h}h`;
  if (!m && t > 0) return "<1min";
  return `${m}min`;
}
export function fmtClock(total: number) {
  const t = Math.max(0, Math.floor(total));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`;
}

/** Aceita "2h12", "2h 12min", "1:30", "90" (minutos), "45min". Retorna segundos ou null. */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase().replace(",", ".");
  if (!s) return null;
  let m = s.match(/^(\d+):(\d{1,2})$/);
  if (m) return (+m[1] * 60 + +m[2]) * 60;
  m = s.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+)\s*(?:m|min)?)?$/);
  if (m && (m[1] || m[2])) {
    if (!m[1] && m[2] && !/h/.test(s)) return +m[2] * 60;
    return Math.round((+(m[1] ?? 0) * 60 + +(m[2] ?? 0)) * 60);
  }
  return null;
}

/** Campo de data: o ano precisa ter exatamente 4 dígitos. */
export const DATE_MIN = "1900-01-01";
export const DATE_MAX = "9999-12-31";
export function isValidDateInput(v: string) {
  if (v === "") return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const y = Number(v.slice(0, 4));
  return y >= 1900 && y <= 9999 && !Number.isNaN(Date.parse(v));
}

export type Member = { id: string; nome: string };

/** Responsável = membros da equipe da organização (nunca clientes). */
export function useTeamMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)("list_team_members").then(({ data }: { data: Member[] | null }) => setMembers(data ?? []));
  }, []);
  return members;
}

export const TASK_BUCKET = "tarefas-anexos";
