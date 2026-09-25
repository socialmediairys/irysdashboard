import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CrudProvider } from "@/components/crud/CrudProvider";
import { ClientWorkspace } from "@/components/client-workspace/ClientWorkspace";
import { parseClientTab, type ClientTabKey } from "@/lib/client-workspace";

type Search = { tab: ClientTabKey; view?: "gerenciar" | "preview" };

export const Route = createFileRoute("/_authenticated/admin/clientes/$clienteId")({
  head: () => ({
    meta: [
      { title: "Cliente — Irys" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  // Old tab names (dados, pipeline, gerenciar, preview, cobranca) map to the new tabs.
  validateSearch: (search: Record<string, unknown>): Search => {
    const view = search.view === "preview" || search.tab === "preview" ? "preview" : search.tab === "gerenciar" ? "gerenciar" : undefined;
    return { tab: parseClientTab(search.tab), ...(view ? { view } : {}) };
  },
  component: ClientePage,
});

function ClientePage() {
  const { clienteId } = Route.useParams();
  const { tab, view } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <CrudProvider>
      <ClientWorkspace
        clienteId={clienteId}
        tab={tab}
        portalView={view}
        onTab={(t) => void navigate({ search: { tab: t }, replace: true })}
      />
    </CrudProvider>
  );
}
