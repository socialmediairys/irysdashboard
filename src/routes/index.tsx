import { createFileRoute } from "@tanstack/react-router";
import Painel360 from "@/components/Painel360";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel 360° — Thamirys" },
      { name: "description", content: "Dashboard 360° para gestoras de Social Media: clientes, CRM, finanças, agenda e conteúdo." },
      { property: "og:title", content: "Painel 360°" },
      { property: "og:description", content: "Dashboard 360° para gestoras de Social Media." },
    ],
  }),
  component: Painel360,
});
