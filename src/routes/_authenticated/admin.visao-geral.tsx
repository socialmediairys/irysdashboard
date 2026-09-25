import { createFileRoute, redirect } from "@tanstack/react-router";
import { Overview } from "@/components/overview/Overview";

export const Route = createFileRoute("/_authenticated/admin/visao-geral")({
  head: () => ({ meta: [{ title: "Visão geral — Irys" }] }),
  beforeLoad: ({ location }) => {
    // Links antigos (callbacks OAuth) apontavam para ?tab=integracoes aqui.
    const tab = (location.search as Record<string, unknown>)?.tab;
    if (tab === "integracoes") throw redirect({ to: "/admin/configuracoes", search: { tab: "integracoes" } as never });
  },
  component: Overview,
});
