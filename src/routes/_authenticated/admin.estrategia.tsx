import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/admin/estrategia")({
  head: () => ({ meta: [{ title: "Estratégia — Irys" }] }),
  component: EstrategiaRoute,
});

function EstrategiaRoute() {
  return (
    <div>
      <PageHeader title="Estratégia" description="Jornada estratégica em 13 etapas por cliente." />
      <div className="flex flex-col items-center rounded-lg border border-border bg-card px-6 py-16 text-center">
        <Compass size={28} strokeWidth={1.4} className="text-muted-foreground" />
        <h2 className="mt-4 text-base font-semibold text-foreground">Módulo em construção</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          A jornada de 13 etapas chega em uma próxima fase. Enquanto isso, a estratégia de cada cliente continua acessível pelo perfil do cliente.
        </p>
        <Link to="/admin/clientes" className="mt-5 text-sm font-medium text-primary hover:underline">
          Ir para Clientes
        </Link>
      </div>
    </div>
  );
}
