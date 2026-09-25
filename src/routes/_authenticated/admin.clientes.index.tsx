import { createFileRoute } from "@tanstack/react-router";
import Painel360 from "@/components/Painel360";

export const Route = createFileRoute("/_authenticated/admin/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — Irys" }] }),
  component: () => <Painel360 section="clientes" />,
});
