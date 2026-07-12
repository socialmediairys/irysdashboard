import { createFileRoute } from "@tanstack/react-router";
import { CrudProvider } from "@/components/crud/CrudProvider";
import { CRMPage } from "@/components/Painel360";

export const Route = createFileRoute("/_authenticated/admin/crm")({
  head: () => ({ meta: [{ title: "CRM & Pipeline — Irys OS" }] }),
  component: () => (
    <CrudProvider>
      <CRMPage />
    </CrudProvider>
  ),
});
