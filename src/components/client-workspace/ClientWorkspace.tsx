import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { ClientTabKey } from "@/lib/client-workspace";
import { ClientHeader } from "./ClientHeader";
import { ClientOverview } from "./ClientOverview";
import { ClientTabs } from "./ClientTabs";
import { ContentsTab, FilesTab, FinanceTab, MetricsTab, PlanningTab, PortalTab, StrategyTab } from "./tabs";
import { useClientWorkspace } from "./useClientWorkspace";

export function ClientWorkspace({
  clienteId, tab, onTab, portalView,
}: {
  clienteId: string;
  tab: ClientTabKey;
  onTab: (t: ClientTabKey) => void;
  portalView?: "gerenciar" | "preview";
}) {
  const { data: ws, isLoading } = useClientWorkspace(clienteId);
  const qc = useQueryClient();

  // Reload when the client row changes (e.g. edited in the CRUD sheet).
  useEffect(() => {
    const ch = supabase
      .channel(`ws-${clienteId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes", filter: `id=eq.${clienteId}` }, () => {
        void qc.invalidateQueries({ queryKey: ["client-workspace", clienteId] });
        void qc.invalidateQueries({ queryKey: ["clients-summary"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clienteId, qc]);

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando cliente…</div>;
  if (!ws) {
    return (
      <div className="text-sm text-muted-foreground">
        Cliente não encontrado. <Link to="/admin/clientes" className="text-primary hover:underline">Voltar para clientes</Link>
      </div>
    );
  }

  return (
    <div>
      <ClientHeader ws={ws} />
      <ClientTabs value={tab} onChange={onTab} />
      {tab === "visao-geral" && <ClientOverview ws={ws} goTab={onTab} />}
      {tab === "estrategia" && <StrategyTab ws={ws} />}
      {tab === "conteudos" && <ContentsTab ws={ws} goPortal={() => onTab("portal")} />}
      {tab === "planejamento" && <PlanningTab ws={ws} />}
      {tab === "metricas" && <MetricsTab ws={ws} />}
      {tab === "arquivos" && <FilesTab ws={ws} />}
      {tab === "financeiro" && <FinanceTab ws={ws} />}
      {tab === "portal" && <PortalTab ws={ws} initialView={portalView} />}
    </div>
  );
}
