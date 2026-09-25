import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentMes, type PipelineEtapa, type PipelineStatusValor } from "@/lib/pipeline";
import type { ClientRow } from "@/components/clients/useClientsData";

export type WsTarefa = { id: string; titulo: string; status: string; prazo: string | null; updated_at: string };
export type WsAgenda = { id: string; titulo: string; data_hora: string; concluido: boolean };
export type WsArquivo = { id: string; titulo: string | null; nome_original: string; tipo_arquivo: string; contexto: string; url_publica: string | null; visivel_cliente: boolean; created_at: string };
export type WsDocumento = { id: string; nome: string; url: string; tipo: string | null; publico: boolean; created_at: string };
export type WsEntrada = { id: string; descricao: string; valor: number; data_ref: string; status_pagamento: string; categoria: string | null };
export type WsContaFixa = { id: string; descricao: string; valor: number; frequencia: string; dia_vencimento: number; ativo: boolean };
export type WsConteudo = { id: string; titulo: string | null; tipo: string; created_at: string | null };
export type WsSocial = { id: string; platform: string; username: string | null; connection_type: string; latest?: { snapshot_date: string; followers: number | null; engagement_rate: number | null; reach: number | null } };

export type Workspace = {
  cliente: ClientRow;
  tarefas: WsTarefa[];
  agenda: WsAgenda[];
  arquivos: WsArquivo[];
  documentos: WsDocumento[];
  entradas: WsEntrada[];
  contasFixas: WsContaFixa[];
  onboarding: { id: string; tarefa: string; concluido: boolean; responsavel: string; ordem: number }[];
  tickets: { id: string; assunto: string; status: string; data_abertura: string }[];
  pipeline: { etapa: PipelineEtapa; status: PipelineStatusValor }[];
  estrategia: { pilares: unknown; formatos: unknown; qtd_entregaveis: number; objetivo: string | null; updated_at: string } | null;
  briefing: { lacunas: string | null; updated_at: string } | null;
  evidencias: number;
  conteudos: WsConteudo[];
  social: WsSocial[];
};

async function load(id: string): Promise<Workspace | null> {
  const nowIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const [cli, tar, ag, arq, doc, ent, cf, onb, tk, pipe, est, bri, evi, cont, soc] = await Promise.all([
    supabase.from("clientes").select("id,nome,init,plano_label,plano_atual,valor_mensal,status_contrato,email,telefone,slug,data_inicio_contrato,data_vencimento_contrato,forma_pagamento,created_at,updated_at").eq("id", id).maybeSingle(),
    supabase.from("tarefas").select("id,titulo,status,prazo,updated_at").eq("cliente_id", id).order("prazo", { ascending: true, nullsFirst: false }),
    supabase.from("agenda_itens").select("id,titulo,data_hora,concluido").eq("cliente_id", id).gte("data_hora", nowIso).order("data_hora").limit(10),
    supabase.from("arquivos").select("id,titulo,nome_original,tipo_arquivo,contexto,url_publica,visivel_cliente,created_at").eq("cliente_id", id).order("created_at", { ascending: false }),
    supabase.from("documentos_juridicos").select("id,nome,url,tipo,publico,created_at").eq("cliente_id", id).order("created_at", { ascending: false }),
    supabase.from("entradas_financeiras").select("id,descricao,valor,data_ref,status_pagamento,categoria").eq("cliente_id", id).order("data_ref", { ascending: false }).limit(24),
    supabase.from("contas_fixas").select("id,descricao,valor,frequencia,dia_vencimento,ativo").eq("cliente_id", id),
    supabase.from("onboarding_checklist").select("id,tarefa,concluido,responsavel,ordem").eq("cliente_id", id).order("ordem"),
    supabase.from("suporte_tickets").select("id,assunto,status,data_abertura").eq("cliente_id", id).neq("status", "resolvido"),
    supabase.from("pipeline_status").select("etapa,status").eq("cliente_id", id).eq("mes", currentMes()),
    supabase.from("estrategias").select("pilares,formatos,qtd_entregaveis,objetivo,updated_at").eq("cliente_id", id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("estrategia_briefing").select("lacunas,updated_at").eq("cliente_id", id).maybeSingle(),
    supabase.from("estrategia_evidencias").select("id", { count: "exact", head: true }).eq("cliente_id", id),
    supabase.from("conteudos_cliente").select("id,titulo,tipo,created_at").eq("cliente_id", id).order("created_at", { ascending: false }),
    supabase.from("social_accounts").select("id,platform,username,connection_type").eq("client_id", id),
  ]);
  if (!cli.data) return null;

  const social = (soc.data ?? []) as WsSocial[];
  if (social.length) {
    const { data: snaps } = await supabase
      .from("social_metrics_snapshots")
      .select("social_account_id,snapshot_date,followers,engagement_rate,reach")
      .in("social_account_id", social.map((s) => s.id))
      .order("snapshot_date", { ascending: false });
    for (const s of social) {
      const latest = (snaps ?? []).find((x) => x.social_account_id === s.id);
      if (latest) s.latest = latest;
    }
  }

  return {
    cliente: cli.data as ClientRow,
    tarefas: (tar.data ?? []) as WsTarefa[],
    agenda: ((ag.data ?? []) as WsAgenda[]).filter((a) => !a.concluido),
    arquivos: (arq.data ?? []) as WsArquivo[],
    documentos: (doc.data ?? []) as WsDocumento[],
    entradas: (ent.data ?? []) as WsEntrada[],
    contasFixas: (cf.data ?? []) as WsContaFixa[],
    onboarding: (onb.data ?? []) as Workspace["onboarding"],
    tickets: (tk.data ?? []) as Workspace["tickets"],
    pipeline: (pipe.data ?? []) as Workspace["pipeline"],
    estrategia: (est.data as Workspace["estrategia"]) ?? null,
    briefing: (bri.data as Workspace["briefing"]) ?? null,
    evidencias: evi.count ?? 0,
    conteudos: (cont.data ?? []) as WsConteudo[],
    social,
  };
}

export function useClientWorkspace(id: string) {
  return useQuery({ queryKey: ["client-workspace", id], queryFn: () => load(id), staleTime: 15_000 });
}

export const isDone = (s: string) => ["done", "concluido", "concluida"].includes(s);
export const parseDate = (s: string) => (s.length <= 10 ? new Date(`${s}T00:00:00`) : new Date(s));
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
