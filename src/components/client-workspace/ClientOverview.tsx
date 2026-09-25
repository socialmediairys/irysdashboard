import { StatusBadge } from "@/components/ui/status-badge";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_VARIANT, fmtShort, type ContentStatus } from "@/lib/content";
import { Link } from "@tanstack/react-router";
import { AlertCircle, CalendarClock, Clock, FileSignature, LifeBuoy, ListChecks, OctagonAlert, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { CONTRATO_LABEL, type ClientTabKey } from "@/lib/client-workspace";
import { ETAPA_LABEL, PIPELINE_ETAPAS } from "@/lib/pipeline";
import { brl, fmtDate, isDone, parseDate, type Workspace } from "./useClientWorkspace";
import { useStrategy } from "@/components/strategy/useStrategy";
import { strategyGaps } from "@/components/strategy/StrategyOverview";
import { strategyProgress } from "@/lib/strategy";
import { WsEmpty, WsFact, WsList, WsRow, WsSection, btnOutline } from "./ui";

type GoTab = (t: ClientTabKey) => void;
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export function ClientOverview({ ws, goTab }: { ws: Workspace; goTab: GoTab }) {
  const abertas = ws.tarefas.filter((t) => !isDone(t.status));
  const prox = ws.agenda[0];
  const etapaAtual = PIPELINE_ETAPAS.find((e) => ws.pipeline.find((p) => p.etapa === e)?.status !== "concluido");
  const temPipeline = ws.pipeline.length > 0;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 rounded-lg border border-border bg-card lg:grid-cols-4 [&>*]:border-border [&>*:nth-child(odd)]:border-r lg:[&>*]:border-r lg:[&>*:last-child]:border-r-0 [&>*:nth-child(-n+2)]:border-b lg:[&>*:nth-child(-n+2)]:border-b-0">
        <WsFact
          label="Etapa do mês"
          value={temPipeline ? (etapaAtual ? ETAPA_LABEL[etapaAtual] : "Tudo concluído") : "—"}
          hint={temPipeline ? "Pipeline mensal" : "Sem pipeline neste mês"}
        />
        <WsFact label="Tarefas abertas" value={abertas.length} hint={`${ws.tarefas.length - abertas.length} concluídas`} />
        <WsFact
          label="Próxima reunião"
          value={prox ? fmtDate(new Date(prox.data_hora)) : "—"}
          hint={prox ? prox.titulo : "Nada agendado"}
        />
        <WsFact label="Arquivos" value={ws.arquivos.length + ws.documentos.length} hint={`${ws.documentos.length} documento(s)`} />
      </div>

      <ClientAttention ws={ws} goTab={goTab} />

      <div className="grid gap-10 lg:grid-cols-2">
        <StrategySummary clienteId={ws.cliente.id} goTab={goTab} />
        <ClientNextSteps ws={ws} />
      </div>

      <WsSection title="Conteúdos recentes" action={<button onClick={() => goTab("conteudos")} className="text-[13px] text-muted-foreground hover:text-foreground">Ver todos</button>}>
        {ws.editoriais.length ? (
          <WsList>
            {ws.editoriais.map((c) => (
              <WsRow key={c.id}>
                <span className="w-16 shrink-0 text-[13px] text-muted-foreground">{fmtShort(c.data_prevista)}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{c.titulo || "Sem título"}</span>
                <span className="hidden text-[12px] text-muted-foreground sm:inline">{[c.canal, c.formato].filter(Boolean).join(" · ")}</span>
                <StatusBadge variant={CONTENT_STATUS_VARIANT[c.status as ContentStatus]}>{CONTENT_STATUS_LABEL[c.status as ContentStatus]}</StatusBadge>
              </WsRow>
            ))}
          </WsList>
        ) : <WsEmpty>Nenhum conteúdo editorial ainda.</WsEmpty>}
      </WsSection>

      <WsSection title="Dados do cliente">
        <dl className="grid gap-x-8 gap-y-4 px-5 py-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Info label="E-mail">{ws.cliente.email || "—"}</Info>
          <Info label="Telefone">{ws.cliente.telefone || "—"}</Info>
          <Info label="Serviço">{ws.cliente.plano_label || ws.cliente.plano_atual || "—"}</Info>
          <Info label="Contrato">{CONTRATO_LABEL[ws.cliente.status_contrato] ?? ws.cliente.status_contrato}</Info>
          <Info label="Vigência">
            {ws.cliente.data_inicio_contrato ? fmtDate(parseDate(ws.cliente.data_inicio_contrato)) : "—"}
            {" → "}
            {ws.cliente.data_vencimento_contrato ? fmtDate(parseDate(ws.cliente.data_vencimento_contrato)) : "—"}
          </Info>
          <Info label="Valor mensal">{ws.cliente.valor_mensal != null ? brl(Number(ws.cliente.valor_mensal)) : "—"}</Info>
        </dl>
      </WsSection>
    </div>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-foreground">{children}</dd>
    </div>
  );
}

/** Objective, client-specific pendências. */
export function ClientAttention({ ws, goTab }: { ws: Workspace; goTab: GoTab }) {
  const t0 = today();
  const items: { key: string; icon: typeof AlertCircle; text: string; meta: string; action: ReactNode; urgent?: boolean }[] = [];
  const act = (label: string, tab: ClientTabKey) => <button onClick={() => goTab(tab)} className={btnOutline}>{label}</button>;
  const sprint = <Link to="/admin/sprints" className={btnOutline}>Abrir tarefa</Link>;

  for (const t of ws.tarefas) {
    if (isDone(t.status) || !t.prazo) continue;
    const d = parseDate(t.prazo);
    if (d < t0) items.push({ key: t.id, icon: AlertCircle, text: t.titulo, meta: `Tarefa atrasada · ${fmtDate(d)}`, action: sprint, urgent: true });
    else if (d.getTime() === t0.getTime()) items.push({ key: t.id, icon: Clock, text: t.titulo, meta: "Tarefa vence hoje", action: sprint });
  }
  for (const p of ws.pipeline) if (p.status === "travado")
    items.push({ key: `p-${p.etapa}`, icon: OctagonAlert, text: `${ETAPA_LABEL[p.etapa]} travada`, meta: "Pipeline do mês", action: act("Ver planejamento", "planejamento"), urgent: true });
  const venc = ws.cliente.data_vencimento_contrato ? parseDate(ws.cliente.data_vencimento_contrato) : null;
  if (ws.cliente.status_contrato === "vencido" || (venc && venc < t0))
    items.push({ key: "ct", icon: FileSignature, text: "Contrato vencido — renovar", meta: venc ? `Venceu em ${fmtDate(venc)}` : "Contrato", action: act("Ver financeiro", "financeiro"), urgent: true });
  else if (ws.cliente.status_contrato === "pendente_assinatura")
    items.push({ key: "ct", icon: FileSignature, text: "Contrato aguardando assinatura", meta: "Contrato", action: act("Ver arquivos", "arquivos") });
  for (const e of ws.entradas) if (e.status_pagamento !== "pago" && parseDate(e.data_ref) <= t0)
    items.push({ key: e.id, icon: Wallet, text: `Recebimento pendente: ${e.descricao}`, meta: `${brl(Number(e.valor))} · ${fmtDate(parseDate(e.data_ref))}`, action: act("Ver financeiro", "financeiro") });
  const onb = ws.onboarding.filter((o) => !o.concluido);
  if (onb.length) items.push({ key: "onb", icon: ListChecks, text: `Onboarding incompleto — ${onb.length} ${onb.length === 1 ? "item" : "itens"}`, meta: onb.slice(0, 2).map((o) => o.tarefa).join(", "), action: act("Ver portal", "portal") });
  for (const t of ws.tickets) items.push({ key: t.id, icon: LifeBuoy, text: `Ticket: ${t.assunto}`, meta: `Aberto em ${fmtDate(new Date(t.data_abertura))}`, action: act("Ver portal", "portal") });

  return (
    <WsSection title="Prioridades" description="Pendências deste cliente.">
      {items.length ? (
        <WsList>
          {items.map((i) => (
            <WsRow key={i.key} className="py-3.5">
              <i.icon size={17} strokeWidth={1.6} className={i.urgent ? "shrink-0 text-primary" : "shrink-0 text-muted-foreground"} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{i.text}</div>
                <div className="truncate text-[13px] text-muted-foreground">{i.meta}</div>
              </div>
              {i.action}
            </WsRow>
          ))}
        </WsList>
      ) : <WsEmpty>Nenhuma pendência para este cliente.</WsEmpty>}
    </WsSection>
  );
}

export function ClientNextSteps({ ws }: { ws: Workspace }) {
  const steps = [
    ...ws.agenda.map((a) => ({ id: a.id, icon: CalendarClock, title: a.titulo, date: new Date(a.data_hora), kind: "Reunião", to: "/admin/agenda" })),
    ...ws.tarefas.filter((t) => !isDone(t.status) && t.prazo && parseDate(t.prazo) >= today())
      .map((t) => ({ id: t.id, icon: Clock, title: t.titulo, date: parseDate(t.prazo!), kind: "Tarefa", to: "/admin/sprints" })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6);

  return (
    <WsSection title="Próximos passos">
      {steps.length ? (
        <WsList>
          {steps.map((s) => (
            <Link key={s.id} to={s.to} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/60">
              <s.icon size={16} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{s.title}</span>
              <span className="shrink-0 text-[12px] text-muted-foreground">{s.kind} · {fmtDate(s.date)}</span>
            </Link>
          ))}
        </WsList>
      ) : <WsEmpty>Nenhuma reunião ou tarefa com prazo à frente.</WsEmpty>}
    </WsSection>
  );
}

function StrategySummary({ clienteId, goTab }: { clienteId: string; goTab: GoTab }) {
  const { data } = useStrategy(clienteId);
  const prog = strategyProgress(data?.etapas ?? []);
  const gaps = data ? strategyGaps(data) : [];
  return (
    <WsSection title="Progresso estratégico" action={<button onClick={() => goTab("estrategia")} className={btnOutline}>Abrir estratégia</button>}>
      {!data ? <WsEmpty>Carregando…</WsEmpty> : !prog.iniciada ? (
        <WsEmpty title="Jornada estratégica ainda não iniciada">Comece pelo Briefing Estratégico.</WsEmpty>
      ) : (
        <WsList>
          <WsRow><span className="flex-1 text-sm text-muted-foreground">Progresso</span><span className="text-sm font-medium text-foreground">{prog.pct}% · {prog.concluidas}/13 etapas</span></WsRow>
          <WsRow><span className="flex-1 text-sm text-muted-foreground">Etapa atual</span><span className="truncate text-sm text-foreground">{prog.atual ? `${prog.atual.n}. ${prog.atual.titulo}` : "Concluída"}</span></WsRow>
          <WsRow><span className="flex-1 text-sm text-muted-foreground">Última atualização</span><span className="text-sm text-foreground">{prog.last ? fmtDate(new Date(prog.last)) : "—"}</span></WsRow>
          <WsRow><span className="flex-1 text-sm text-muted-foreground">Lacunas</span><span className="text-sm text-foreground">{gaps.length}</span></WsRow>
        </WsList>
      )}
    </WsSection>
  );
}
