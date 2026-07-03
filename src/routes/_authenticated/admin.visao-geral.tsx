import { createFileRoute } from "@tanstack/react-router";
import Painel360 from "@/components/Painel360";

export const Route = createFileRoute("/_authenticated/admin/visao-geral")({
  component: AdminVisaoGeralPage,
});

function AdminVisaoGeralPage() {
  return <Painel360 />;
}
