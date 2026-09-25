import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import Painel360 from "@/components/Painel360";
import { PageHeader } from "@/components/layout/PageHeader";
import { RelatorioGlobal } from "@/components/metricas/RelatorioGlobal";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Irys" }] }),
  component: RelatoriosRoute,
});

function RelatoriosRoute() {
  return (
    <div>
      <PageHeader title="Relatórios" description="Visão analítica global das métricas sociais. A aba Métricas de cada cliente mostra o recorte dos mesmos dados." />
      <RelatorioGlobal />
      <h3 className="mb-2 text-base font-semibold text-foreground">Instagram conectado</h3>
      <div className="mb-4 flex justify-end">
        <Link
          to="/admin/metricas-sociais"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Lançamentos manuais de métricas <ExternalLink size={14} strokeWidth={1.6} />
        </Link>
      </div>
      <Painel360 section="social" />
    </div>
  );
}
