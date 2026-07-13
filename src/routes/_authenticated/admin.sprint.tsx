import { createFileRoute } from "@tanstack/react-router";
import { CrudProvider } from "@/components/crud/CrudProvider";
import { SprintPage } from "@/components/Sprint";

export const Route = createFileRoute("/_authenticated/admin/sprint")({
  head: () => ({ meta: [{ title: "Sprint — Irys OS" }] }),
  component: () => (
    <CrudProvider>
      <SprintPage />
    </CrudProvider>
  ),
});
