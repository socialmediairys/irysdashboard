import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, FileText, MessageCircle, Send } from "lucide-react";
import { CobrancaWaMeButton, CobrancaWhatsappButton, type ClienteRow } from "@/components/Painel360";
import { PipelineMatrix } from "@/components/pipeline/PipelineMatrix";
import { PortalConteudosManager } from "@/components/portal/PortalConteudosManager";
import { PortalPreview } from "@/components/portal/PortalPreview";
import { ContentModule } from "@/components/content/ContentModule";
import { PlannedItems } from "@/components/content/PlannedItems";
import { StrategyWorkspace } from "@/components/strategy/StrategyWorkspace";
import { cn } from "@/lib/utils";
import { brl, fmtDate, parseDate, type Workspace } from "./useClientWorkspace";
import { WsEmpty, WsList, WsRow, WsSection, btnOutline } from "./ui";

/* ---------- Estratégia (Fase 4) ---------- */
export function StrategyTab({ ws }: { ws: Workspace }) {
  return <StrategyWorkspace clienteId={ws.cliente.id} clienteNome={ws.cliente.nome} />;
}

/* ---------- Conteúdos: mesma fonte do módulo global, filtrada pelo cliente ---------- */
export function ContentsTab({ ws, goPortal }: { ws: Workspace; goPortal: () => void }) {
  return (
    <div className="space-y-10">
      <ContentModule clienteId={ws.cliente.id} initialView="producao" />
      {ws.conteudos.length > 0 && (
        <WsSection title="Materiais da Central do Cliente" description="Documentos e vídeos de onboarding (briefing, contrato, tom de voz…). Preservados como estão — não são publicações." action={<button onClick={goPortal} className={btnOutline}>Gerenciar no Portal</button>}>
          <WsList>
            {ws.conteudos.map((c) => (
              <WsRow key={c.id}>
                <FileText size={16} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{c.titulo || "Sem título"}</span>
                <span className="text-[12px] text-muted-foreground">{c.tipo}{c.created_at ? ` · ${fmtDate(new Date(c.created_at))}` : ""}</span>
              </WsRow>
            ))}
          </WsList>
        </WsSection>
      )}
    </div>
  );
}

/* ---------- Planejamento (pipeline mensal atual) ---------- */
export function PlanningTab({ ws }: { ws: Workspace }) {
  return (
    <div className="space-y-10">
    <PlannedItems clienteId={ws.cliente.id} />
    <WsSection title="Pipeline do mês" description="Etapas operacionais mensais (estratégia, linha editorial, design, copy, métricas). Clique numa célula para mudar o status. A linha destacada é deste cliente.">
      <div className="p-4"><PipelineMatrix highlightClienteId={ws.cliente.id} /></div>
    </WsSection>
    </div>
  );
}

/* ---------- Métricas (contexto do cliente) ---------- */
export function MetricsTab({ ws }: { ws: Workspace }) {
  return (
    <WsSection
      title="Redes sociais"
      description="Último registro de cada conta. A análise completa fica em Relatórios."
      action={<Link to="/admin/metricas-sociais" className={btnOutline}>Lançar métricas</Link>}
    >
      {ws.social.length ? (
        <WsList>
          {ws.social.map((s) => (
            <WsRow key={s.id} className="flex-wrap py-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium capitalize text-foreground">{s.platform}{s.username ? ` · @${s.username.replace(/^@/, "")}` : ""}</div>
                <div className="text-[13px] text-muted-foreground">
                  {s.latest ? `Atualizado em ${fmtDate(parseDate(s.latest.snapshot_date))}` : "Sem registros ainda"}
                </div>
              </div>
              {s.latest && (
                <div className="flex gap-6 text-sm">
                  <Metric label="Seguidores" v={s.latest.followers?.toLocaleString("pt-BR")} />
                  <Metric label="Engajamento" v={s.latest.engagement_rate != null ? `${Number(s.latest.engagement_rate).toLocaleString("pt-BR")}%` : undefined} />
                  <Metric label="Alcance" v={s.latest.reach?.toLocaleString("pt-BR")} />
                </div>
              )}
            </WsRow>
          ))}
        </WsList>
      ) : <WsEmpty>Nenhuma conta social vinculada a este cliente.</WsEmpty>}
    </WsSection>
  );
}
function Metric({ label, v }: { label: string; v?: string }) {
  return <div><div className="text-[12px] text-muted-foreground">{label}</div><div className="font-semibold text-foreground">{v ?? "—"}</div></div>;
}

/* ---------- Arquivos (arquivos + documentos jurídicos) ---------- */
const CONTEXTO: Record<string, string> = {
  central_cliente: "Central do Cliente", onboarding_sistema: "Onboarding", tarefa: "Tarefa",
  recurso_marca: "Marca", documento_juridico: "Jurídico", geral: "Geral",
};
export function FilesTab({ ws }: { ws: Workspace }) {
  return (
    <div className="space-y-10">
      <WsSection title="Documentos" description="Contratos e documentos jurídicos." action={<Link to="/admin/juridico" className={btnOutline}>Jurídico</Link>}>
        {ws.documentos.length ? (
          <WsList>
            {ws.documentos.map((d) => (
              <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/60">
                <FileText size={16} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{d.nome}</span>
                <span className="text-[12px] text-muted-foreground">{d.publico ? "Visível ao cliente" : "Interno"} · {fmtDate(new Date(d.created_at))}</span>
              </a>
            ))}
          </WsList>
        ) : <WsEmpty>Nenhum documento.</WsEmpty>}
      </WsSection>
      <WsSection title="Arquivos e mídias" description="Tudo que foi enviado para este cliente, na Biblioteca e na Central do Cliente." action={<Link to="/admin/biblioteca-midia" className={btnOutline}>Biblioteca</Link>}>
        {ws.arquivos.length ? (
          <WsList>
            {ws.arquivos.map((a) => {
              const body = (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{a.titulo || a.nome_original}</span>
                  <span className="hidden text-[12px] text-muted-foreground sm:inline">{CONTEXTO[a.contexto] ?? a.contexto} · {a.tipo_arquivo}</span>
                  <span className="text-[12px] text-muted-foreground">{a.visivel_cliente ? "Visível" : "Interno"} · {fmtDate(new Date(a.created_at))}</span>
                </>
              );
              return a.url_publica ? (
                <a key={a.id} href={a.url_publica} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/60">{body}</a>
              ) : <WsRow key={a.id}>{body}</WsRow>;
            })}
          </WsList>
        ) : <WsEmpty>Nenhum arquivo enviado.</WsEmpty>}
      </WsSection>
    </div>
  );
}

/* ---------- Financeiro (somente do cliente; nunca exposto ao portal) ---------- */
export function FinanceTab({ ws }: { ws: Workspace }) {
  const c = ws.cliente;
  const row = c as unknown as ClienteRow;
  return (
    <div className="space-y-10">
      <WsSection title="Cobrança" description="Envie a cobrança pelo WhatsApp.">
        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <div className="flex items-center gap-2 text-sm"><Send size={15} strokeWidth={1.6} className="text-muted-foreground" /> Mensagem rápida <CobrancaWaMeButton cliente={row} /></div>
          <div className="flex items-center gap-2 text-sm"><MessageCircle size={15} strokeWidth={1.6} className="text-muted-foreground" /> Cobrança oficial <CobrancaWhatsappButton clienteId={c.id} nome={c.nome} /></div>
          {!c.telefone && <span className="text-[13px] text-destructive">Cadastre um telefone para enviar cobranças.</span>}
        </div>
      </WsSection>

      <WsSection title="Lançamentos" description="Entradas vinculadas a este cliente." action={<Link to="/admin/financeiro" search={{ cliente: c.id }} className={btnOutline}>Financeiro global <ExternalLink size={13} strokeWidth={1.6} /></Link>}>
        {ws.entradas.length ? (
          <WsList>
            {ws.entradas.map((e) => (
              <WsRow key={e.id}>
                <span className="w-16 shrink-0 text-[13px] text-muted-foreground">{fmtDate(parseDate(e.data_ref))}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{e.descricao}</span>
                <span className="text-sm text-foreground">{brl(Number(e.valor))}</span>
                <span className={cn("w-20 text-right text-[12px]", e.status_pagamento === "pago" ? "text-success" : "text-primary")}>
                  {e.status_pagamento === "pago" ? "Pago" : "Pendente"}
                </span>
              </WsRow>
            ))}
          </WsList>
        ) : <WsEmpty>Nenhum lançamento vinculado a este cliente.</WsEmpty>}
      </WsSection>

      {ws.contasFixas.length > 0 && (
        <WsSection title="Recorrências">
          <WsList>
            {ws.contasFixas.map((f) => (
              <WsRow key={f.id}>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{f.descricao}</span>
                <span className="text-[13px] text-muted-foreground">{f.frequencia} · dia {f.dia_vencimento}</span>
                <span className="text-sm text-foreground">{brl(Number(f.valor))}</span>
              </WsRow>
            ))}
          </WsList>
        </WsSection>
      )}
    </div>
  );
}

/* ---------- Portal (substitui "Gerenciar portais" por cliente) ---------- */
export function PortalTab({ ws, initialView }: { ws: Workspace; initialView?: "gerenciar" | "preview" }) {
  const [view, setView] = useState<"gerenciar" | "preview">(initialView ?? "gerenciar");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {(["gerenciar", "preview"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn("rounded px-3 py-1.5 text-[13px] transition-colors", view === v ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {v === "gerenciar" ? "Gerenciar conteúdo" : "Ver como cliente"}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-muted-foreground">O que você adiciona aqui aparece na Central do Cliente.</p>
      </div>
      {view === "gerenciar" ? <PortalConteudosManager clienteId={ws.cliente.id} /> : <PortalPreview clienteId={ws.cliente.id} />}
    </div>
  );
}
