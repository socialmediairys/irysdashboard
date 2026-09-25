import { createFileRoute } from "@tanstack/react-router";
import { CrudProvider } from "@/components/crud/CrudProvider";
import { ClientsList } from "@/components/clients/ClientsList";

export const Route = createFileRoute("/_authenticated/admin/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — Irys" }] }),
  component: () => (
    <CrudProvider>
      <ClientsList />
    </CrudProvider>
  ),
});
