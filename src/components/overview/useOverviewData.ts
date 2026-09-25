import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentMes, ETAPA_LABEL, type PipelineEtapa } from "@/lib/pipeline";

export type ClienteLite = {
  id: string;
  nome: string;
  status_contrato: string;
  valor_mensal: number | null;
  data_vencimento_contrato: string | null;
  created_at: string;
  updated_at: string;
};
export type TarefaLite = {
  id: string;
  titulo: string;
  status: string;
  prazo: string | null;
  cliente_id: string | null;
  updated_at: string;
};
export type AgendaLite = {
  id: string;
  titulo: string;
  data_hora: string;
  cliente_id: string | null;
  concluido: boolean;
};

export type PriorityKind =
  | "tarefa_atrasada"
  | "tarefa_hoje"
  | "etapa_travada"
  | "reuniao"
  | "ticket"
  | "recebimento"
  | "contrato"
  | "conteudo_atrasado"
  | "conteudo_incompleto"
  | "conteudo_revisao"
  | "aprovacao_pendente"
  | "alteracao_solicitada";

export type Priority = {
  id: string;
  kind: PriorityKind;
  title: string;
  clienteId: string | null;
  clienteNome: string | null;
  due: Date | null;
  /** Lower = more urgent. */
  rank: number;
  action: { label: string; to: string; params?: Record<string, string>; search?: Record<string, string> };
};

export type AttentionClient = { id: string; nome: string; reasons: string[] };

export type ActivityItem = { id: string; label: string; detail: string; at: string; to?: string; params?: Record<string, string> };

export type OverviewData = {
  firstName: string;
  stats: {
    clientesAtivos: number;
    tarefasSemana: number;
    tarefasAtrasadas: number;
    faturamentoPrevisto: number;
    recebidoMes: number;
    conteudosProducao: number;
  };
  production: { producao: number; revisao: number; comCliente: number; aprovados: number; publicados: number };
  priorities: Priority[];
  week: { date: Date; items: { id: string; kind: "reuniao" | "tarefa"; title: string; time?: string; cliente?: string; to: string }[] }[];
  attention: AttentionClient[];
  activity: ActivityItem[];
};

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isDone = (s: string) => ["done", "concluido", "concluida"].includes(s);
/** Prazo is a date-only string; parse as local date. */
const parseDate = (s: string) => (s.length <= 10 ? new Date(`${s}T00:00:00`) : new Date(s));

async function load(): Promise<OverviewData> {
  const now = new Date();
  const today = startOfDay(now);
  const in7 = new Date(today.getTime() + 7 * DAY);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const { data: u } = await supabase.auth.getUser();
  const [prof, cli, tar, ag, pipe, tick, fin, onb, arq, cont] = await Promise.all([
    u.user ? supabase.from("profiles").select("nome").eq("id", u.user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("clientes").select("id,nome,status_contrato,valor_mensal,data_vencimento_contrato,created_at,updated_at"),
    supabase.from("tarefas").select("id,titulo,status,prazo,cliente_id,updated_at").order("updated_at", { ascending: false }).limit(500),
    supabase.from("agenda_itens").select("id,titulo,data_hora,cliente_id,concluido")
      .gte("data_hora", today.toISOString()).lt("data_hora", in7.toISOString()).order("data_hora"),
    supabase.from("pipeline_status").select("cliente_id,etapa,status").eq("mes", currentMes()).eq("status", "travado"),
    supabase.from("suporte_tickets").select("id,assunto,cliente_id,data_abertura,status").neq("status", "resolvido"),
    supabase.from("entradas_financeiras").select("id,descricao,valor,data_ref,status_pagamento,cliente_id").gte("data_ref", monthStart),
    supabase.from("onboarding_checklist").select("cliente_id,concluido").eq("concluido", false),
    supabase.from("arquivos").select("id,titulo,nome_original,cliente_id,created_at").order("created_at", { ascending: false }).limit(5),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("conteudos").select("id,titulo,status,data_prevista,cliente_id,legenda,midias:conteudo_midias(id)").neq("status", "ideia").limit(2000),
  ]);
  const conteudos = (cont.data ?? []) as { id: string; titulo: string; status: string; data_prevista: string | null; cliente_id: string; legenda: string | null; midias: { id: string }[] }[];

  const clientes = (cli.data ?? []) as ClienteLite[];
  const nomeDe = new Map(clientes.map((c) => [c.id, c.nome]));
  const tarefas = (tar.data ?? []) as TarefaLite[];
  const agenda = ((ag.data ?? []) as AgendaLite[]).filter((a) => !a.concluido);
  const ativos = clientes.filter((c) => c.status_contrato === "ativo");

  const weekEnd = new Date(today.getTime() + 7 * DAY);
  const abertas = tarefas.filter((t) => !isDone(t.status) && t.prazo);
  const atrasadas = abertas.filter((t) => parseDate(t.prazo!) < today);
  const hoje = abertas.filter((t) => startOfDay(parseDate(t.prazo!)).getTime() === today.getTime());
  const semana = abertas.filter((t) => { const d = parseDate(t.prazo!); return d >= today && d < weekEnd; });

  const entradas = (fin.data ?? []) as { id: string; descricao: string; valor: number; data_ref: string; status_pagamento: string; cliente_id: string | null }[];
  const recebidoMes = entradas.filter((e) => e.status_pagamento === "pago").reduce((s, e) => s + Number(e.valor || 0), 0);

  const p: Priority[] = [];
  const cn = (id: string | null) => (id ? nomeDe.get(id) ?? null : null);
  for (const t of atrasadas) {
    const d = parseDate(t.prazo!);
    p.push({ id: `ta-${t.id}`, kind: "tarefa_atrasada", title: t.titulo, clienteId: t.cliente_id, clienteNome: cn(t.cliente_id), due: d, rank: 0 + d.getTime() / 1e13, action: { label: "Abrir tarefa", to: "/admin/sprints", search: { task: t.id } } });
  }
  for (const t of hoje) {
    p.push({ id: `th-${t.id}`, kind: "tarefa_hoje", title: t.titulo, clienteId: t.cliente_id, clienteNome: cn(t.cliente_id), due: parseDate(t.prazo!), rank: 2, action: { label: "Abrir tarefa", to: "/admin/sprints", search: { task: t.id } } });
  }
  for (const r of (pipe.data ?? []) as { cliente_id: string; etapa: PipelineEtapa }[]) {
    p.push({ id: `pt-${r.cliente_id}-${r.etapa}`, kind: "etapa_travada", title: `Etapa ${ETAPA_LABEL[r.etapa]} travada`, clienteId: r.cliente_id, clienteNome: cn(r.cliente_id), due: null, rank: 1, action: { label: "Ver cliente", to: "/admin/clientes/$clienteId", params: { clienteId: r.cliente_id }, search: { tab: "planejamento" } } });
  }
  for (const a of agenda) {
    const d = new Date(a.data_hora);
    if (d.getTime() - now.getTime() > 2 * DAY) continue;
    p.push({ id: `ag-${a.id}`, kind: "reuniao", title: a.titulo, clienteId: a.cliente_id, clienteNome: cn(a.cliente_id), due: d, rank: 3 + d.getTime() / 1e13, action: { label: "Ver agenda", to: "/admin/agenda" } });
  }
  for (const t of (tick.data ?? []) as { id: string; assunto: string; cliente_id: string; data_abertura: string }[]) {
    p.push({ id: `tk-${t.id}`, kind: "ticket", title: `Ticket: ${t.assunto}`, clienteId: t.cliente_id, clienteNome: cn(t.cliente_id), due: new Date(t.data_abertura), rank: 4, action: { label: "Ver cliente", to: "/admin/clientes/$clienteId", params: { clienteId: t.cliente_id }, search: { tab: "visao-geral" } } });
  }
  for (const e of entradas) {
    if (e.status_pagamento === "pago") continue;
    const d = parseDate(e.data_ref);
    if (d > today) continue;
    p.push({ id: `fi-${e.id}`, kind: "recebimento", title: `Recebimento pendente: ${e.descricao}`, clienteId: e.cliente_id, clienteNome: cn(e.cliente_id), due: d, rank: 5, action: { label: "Ver financeiro", ...(e.cliente_id ? { to: "/admin/clientes/$clienteId", params: { clienteId: e.cliente_id }, search: { tab: "financeiro" } } : { to: "/admin/financeiro" }) } });
  }
  for (const c of clientes) {
    const venc = c.data_vencimento_contrato ? parseDate(c.data_vencimento_contrato) : null;
    const pendente = c.status_contrato === "pendente_assinatura";
    const vencendo = c.status_contrato === "ativo" && venc && venc.getTime() - today.getTime() < 30 * DAY;
    if (!pendente && !vencendo && c.status_contrato !== "vencido") continue;
    const passou = venc && venc < today;
    const title = pendente ? "Contrato aguardando assinatura" : c.status_contrato === "vencido" || passou ? "Contrato vencido — renovar" : "Contrato vence em breve";
    p.push({ id: `ct-${c.id}`, kind: "contrato", title, clienteId: c.id, clienteNome: c.nome, due: venc, rank: 6, action: { label: "Ver cliente", to: "/admin/clientes/$clienteId", params: { clienteId: c.id }, search: { tab: "visao-geral" } } });
  }
  const in3 = new Date(today.getTime() + 3 * DAY);
  for (const c of conteudos) {
    const d = c.data_prevista ? parseDate(c.data_prevista) : null;
    const action = { label: "Abrir conteúdo", to: "/admin/conteudo" };
    if (c.status === "alteracao_solicitada") {
      p.push({ id: `as-${c.id}`, kind: "alteracao_solicitada", title: c.titulo || "Conteúdo", clienteId: c.cliente_id, clienteNome: cn(c.cliente_id), due: d, rank: 0.8, action });
    } else if (c.status === "com_cliente") {
      p.push({ id: `ap-${c.id}`, kind: "aprovacao_pendente", title: c.titulo || "Conteúdo", clienteId: c.cliente_id, clienteNome: cn(c.cliente_id), due: d, rank: d && d < in3 ? 1.2 : 3.5, action });
    } else if (d && d < today && !["publicado", "agendado", "aprovado"].includes(c.status)) {
      p.push({ id: `ca-${c.id}`, kind: "conteudo_atrasado", title: c.titulo || "Conteúdo sem título", clienteId: c.cliente_id, clienteNome: cn(c.cliente_id), due: d, rank: 0.5, action });
    } else if (d && d <= in3 && ["planejado", "em_producao", "revisao_interna"].includes(c.status) && (!c.legenda?.trim() || !c.midias?.length)) {
      p.push({ id: `ci-${c.id}`, kind: "conteudo_incompleto", title: `${c.titulo || "Conteúdo"} — ${!c.midias?.length ? "sem mídia" : "sem legenda"}`, clienteId: c.cliente_id, clienteNome: cn(c.cliente_id), due: d, rank: 1.5, action });
    } else if (c.status === "revisao_interna") {
      p.push({ id: `cr-${c.id}`, kind: "conteudo_revisao", title: c.titulo || "Conteúdo em revisão", clienteId: c.cliente_id, clienteNome: cn(c.cliente_id), due: d, rank: 2.5, action });
    }
  }
  p.sort((a, b) => a.rank - b.rank);
  const cnt = (...s: string[]) => conteudos.filter((c) => s.includes(c.status)).length;

  // Week (next 7 days)
  const week: OverviewData["week"] = Array.from({ length: 7 }, (_, i) => ({ date: new Date(today.getTime() + i * DAY), items: [] }));
  const idx = (d: Date) => Math.floor((startOfDay(d).getTime() - today.getTime()) / DAY);
  for (const a of agenda) {
    const d = new Date(a.data_hora); const i = idx(d);
    if (i >= 0 && i < 7) week[i].items.push({ id: `a-${a.id}`, kind: "reuniao", title: a.titulo, time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), cliente: cn(a.cliente_id) ?? undefined, to: "/admin/agenda" });
  }
  for (const t of semana) {
    const i = idx(parseDate(t.prazo!));
    if (i >= 0 && i < 7) week[i].items.push({ id: `t-${t.id}`, kind: "tarefa", title: t.titulo, cliente: cn(t.cliente_id) ?? undefined, to: "/admin/sprints" });
  }

  // Clients needing attention — explicit reasons only
  const reasons = new Map<string, Set<string>>();
  const add = (id: string | null, r: string) => { if (!id || !nomeDe.has(id)) return; if (!reasons.has(id)) reasons.set(id, new Set()); reasons.get(id)!.add(r); };
  const atrasadasPorCliente = new Map<string, number>();
  for (const t of atrasadas) if (t.cliente_id) atrasadasPorCliente.set(t.cliente_id, (atrasadasPorCliente.get(t.cliente_id) ?? 0) + 1);
  atrasadasPorCliente.forEach((n, id) => add(id, n === 1 ? "1 tarefa atrasada" : `${n} tarefas atrasadas`));
  for (const r of (pipe.data ?? []) as { cliente_id: string; etapa: PipelineEtapa }[]) add(r.cliente_id, `${ETAPA_LABEL[r.etapa]} travada`);
  for (const t of (tick.data ?? []) as { cliente_id: string }[]) add(t.cliente_id, "Ticket de suporte aberto");
  for (const a of agenda) add(a.cliente_id, "Reunião nos próximos dias");
  for (const e of entradas) if (e.status_pagamento !== "pago" && parseDate(e.data_ref) <= today) add(e.cliente_id, "Recebimento pendente");
  const onbPend = new Map<string, number>();
  for (const o of (onb.data ?? []) as { cliente_id: string }[]) onbPend.set(o.cliente_id, (onbPend.get(o.cliente_id) ?? 0) + 1);
  onbPend.forEach((n, id) => add(id, `Onboarding incompleto (${n} ${n === 1 ? "item" : "itens"})`));
  for (const c of clientes) {
    if (c.status_contrato === "pendente_assinatura") add(c.id, "Contrato aguardando assinatura");
    if (c.status_contrato === "vencido") add(c.id, "Contrato vencido");
  }
  const lastTask = new Map<string, number>();
  for (const t of tarefas) if (t.cliente_id) lastTask.set(t.cliente_id, Math.max(lastTask.get(t.cliente_id) ?? 0, new Date(t.updated_at).getTime()));
  for (const c of ativos) {
    const last = Math.max(lastTask.get(c.id) ?? 0, new Date(c.updated_at).getTime());
    if (now.getTime() - last > 30 * DAY) add(c.id, "Sem atividade há mais de 30 dias");
  }
  const attention = [...reasons.entries()]
    .map(([id, r]) => ({ id, nome: nomeDe.get(id)!, reasons: [...r] }))
    .sort((a, b) => b.reasons.length - a.reasons.length);

  // Recent activity — only real events
  const activity: ActivityItem[] = [];
  for (const t of tarefas.filter((t) => isDone(t.status)).slice(0, 5))
    activity.push({ id: `d-${t.id}`, label: "Tarefa concluída", detail: t.titulo + (cn(t.cliente_id) ? ` · ${cn(t.cliente_id)}` : ""), at: t.updated_at, to: "/admin/sprints" });
  for (const a of (arq.data ?? []) as { id: string; titulo: string | null; nome_original: string; cliente_id: string | null; created_at: string }[])
    activity.push({ id: `f-${a.id}`, label: "Arquivo adicionado", detail: (a.titulo || a.nome_original) + (cn(a.cliente_id) ? ` · ${cn(a.cliente_id)}` : ""), at: a.created_at, to: "/admin/biblioteca-midia" });
  for (const c of [...clientes].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3))
    activity.push({ id: `c-${c.id}`, label: "Cliente cadastrado", detail: c.nome, at: c.created_at, to: "/admin/clientes/$clienteId", params: { clienteId: c.id } });
  activity.sort((a, b) => b.at.localeCompare(a.at));

  const nome = (prof.data as { nome?: string | null } | null)?.nome ?? "";
  return {
    firstName: nome.split(" ")[0] || "",
    stats: {
      clientesAtivos: ativos.length,
      tarefasSemana: semana.length + atrasadas.length,
      tarefasAtrasadas: atrasadas.length,
      faturamentoPrevisto: ativos.reduce((s, c) => s + Number(c.valor_mensal || 0), 0),
      recebidoMes,
      conteudosProducao: cnt("planejado", "em_producao", "revisao_interna", "alteracao_solicitada"),
    },
    production: { producao: cnt("planejado", "em_producao", "alteracao_solicitada"), revisao: cnt("revisao_interna"), comCliente: cnt("com_cliente"), aprovados: cnt("aprovado", "agendado"), publicados: cnt("publicado") },
    priorities: p,
    week,
    attention,
    activity: activity.slice(0, 8),
  };
}

export function useOverviewData() {
  return useQuery({ queryKey: ["overview"], queryFn: load, staleTime: 30_000 });
}
