import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { clientGroup, type ClientGroup } from "@/lib/client-workspace";
import { currentMes, ETAPA_LABEL, type PipelineEtapa } from "@/lib/pipeline";

const DAY = 86_400_000;
const isDone = (s: string) => ["done", "concluido", "concluida"].includes(s);
const parseDate = (s: string) => (s.length <= 10 ? new Date(`${s}T00:00:00`) : new Date(s));
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export type ClientRow = {
  id: string;
  nome: string;
  init: string | null;
  plano_label: string | null;
  plano_atual: string | null;
  valor_mensal: number | null;
  status_contrato: string;
  email: string | null;
  telefone: string | null;
  slug: string | null;
  data_inicio_contrato: string | null;
  data_vencimento_contrato: string | null;
  forma_pagamento: string | null;
  created_at: string;
  updated_at: string;
};

export type NextAction = { label: string; date: Date; kind: "reuniao" | "tarefa" };

export type ClientSummary = {
  cliente: ClientRow;
  group: ClientGroup;
  servico: string;
  nextAction: NextAction | null;
  lastActivity: Date;
  signals: string[];
  onboardingPendente: number;
};

type Tarefa = { id: string; titulo: string; status: string; prazo: string | null; cliente_id: string | null; updated_at: string };
type Agenda = { id: string; titulo: string; data_hora: string; cliente_id: string | null; concluido: boolean };

/** Loads all clients plus the rows needed to compute objective signals. */
async function loadClients(): Promise<ClientSummary[]> {
  const today = startOfToday();
  const [cli, tar, ag, onb, fin, arq, pipe, tick] = await Promise.all([
    supabase.from("clientes").select("id,nome,init,plano_label,plano_atual,valor_mensal,status_contrato,email,telefone,slug,data_inicio_contrato,data_vencimento_contrato,forma_pagamento,created_at,updated_at").order("nome"),
    supabase.from("tarefas").select("id,titulo,status,prazo,cliente_id,updated_at").not("cliente_id", "is", null),
    supabase.from("agenda_itens").select("id,titulo,data_hora,cliente_id,concluido").gte("data_hora", today.toISOString()).eq("concluido", false).order("data_hora"),
    supabase.from("onboarding_checklist").select("cliente_id").eq("concluido", false),
    supabase.from("entradas_financeiras").select("cliente_id,data_ref,status_pagamento").neq("status_pagamento", "pago"),
    supabase.from("arquivos").select("cliente_id,created_at").not("cliente_id", "is", null),
    supabase.from("pipeline_status").select("cliente_id,etapa").eq("mes", currentMes()).eq("status", "travado"),
    supabase.from("suporte_tickets").select("cliente_id").neq("status", "resolvido"),
  ]);
  const clientes = (cli.data ?? []) as ClientRow[];
  const tarefas = (tar.data ?? []) as Tarefa[];
  const agenda = (ag.data ?? []) as Agenda[];

  const count = <T extends { cliente_id: string | null }>(rows: T[], pred: (r: T) => boolean = () => true) => {
    const m = new Map<string, number>();
    for (const r of rows) if (r.cliente_id && pred(r)) m.set(r.cliente_id, (m.get(r.cliente_id) ?? 0) + 1);
    return m;
  };
  const onbMap = count((onb.data ?? []) as { cliente_id: string }[]);
  const finMap = count((fin.data ?? []) as { cliente_id: string | null; data_ref: string }[], (r) => parseDate(r.data_ref) <= today);
  const atrMap = count(tarefas, (t) => !isDone(t.status) && !!t.prazo && parseDate(t.prazo) < today);
  const tickMap = count((tick.data ?? []) as { cliente_id: string }[]);
  const travadas = new Map<string, string[]>();
  for (const r of (pipe.data ?? []) as { cliente_id: string; etapa: PipelineEtapa }[]) {
    travadas.set(r.cliente_id, [...(travadas.get(r.cliente_id) ?? []), ETAPA_LABEL[r.etapa]]);
  }

  return clientes.map((c) => {
    const ts = tarefas.filter((t) => t.cliente_id === c.id);
    const lastTs = [
      new Date(c.updated_at).getTime(),
      ...ts.map((t) => new Date(t.updated_at).getTime()),
      ...((arq.data ?? []) as { cliente_id: string; created_at: string }[]).filter((a) => a.cliente_id === c.id).map((a) => new Date(a.created_at).getTime()),
    ];
    const lastActivity = new Date(Math.max(...lastTs));

    const nextMeeting = agenda.find((a) => a.cliente_id === c.id);
    const nextTask = ts.filter((t) => !isDone(t.status) && t.prazo).sort((a, b) => a.prazo!.localeCompare(b.prazo!))[0];
    const cands: NextAction[] = [];
    if (nextMeeting) cands.push({ label: nextMeeting.titulo, date: new Date(nextMeeting.data_hora), kind: "reuniao" });
    if (nextTask) cands.push({ label: nextTask.titulo, date: parseDate(nextTask.prazo!), kind: "tarefa" });
    cands.sort((a, b) => a.date.getTime() - b.date.getTime());

    const signals: string[] = [];
    const venc = c.data_vencimento_contrato ? parseDate(c.data_vencimento_contrato) : null;
    if (c.status_contrato === "vencido" || (venc && venc < today && c.status_contrato === "ativo")) signals.push("Contrato vencido");
    else if (c.status_contrato === "pendente_assinatura") signals.push("Contrato sem assinatura");
    else if (venc && venc.getTime() - today.getTime() < 30 * DAY && c.status_contrato === "ativo") signals.push("Contrato vence em breve");
    const onbN = onbMap.get(c.id) ?? 0;
    if (onbN) signals.push(`Onboarding incompleto (${onbN})`);
    const atr = atrMap.get(c.id) ?? 0;
    if (atr) signals.push(atr === 1 ? "1 tarefa atrasada" : `${atr} tarefas atrasadas`);
    if (finMap.get(c.id)) signals.push("Pagamento pendente");
    for (const e of travadas.get(c.id) ?? []) signals.push(`${e} travada`);
    if (tickMap.get(c.id)) signals.push("Ticket aberto");
    if (c.status_contrato === "ativo" && Date.now() - lastActivity.getTime() > 30 * DAY) signals.push("Sem atividade há 30+ dias");

    return {
      cliente: c,
      group: clientGroup(c.status_contrato, onbN),
      servico: c.plano_label || c.plano_atual || "—",
      nextAction: cands[0] ?? null,
      lastActivity,
      signals,
      onboardingPendente: onbN,
    };
  });
}

export function useClientsData() {
  return useQuery({ queryKey: ["clients-summary"], queryFn: loadClients, staleTime: 15_000 });
}
