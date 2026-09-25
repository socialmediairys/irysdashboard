import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import Painel360 from "@/components/Painel360";

export const Route = createFileRoute("/_authenticated/admin/conteudo")({
  head: () => ({ meta: [{ title: "Conteúdo — Irys" }] }),
  component: ConteudoRoute,
});

function ConteudoRoute() {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link
          to="/admin/portal-conteudos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Gerenciar portais dos clientes <ExternalLink size={14} strokeWidth={1.6} />
        </Link>
      </div>
      <Painel360 section="conteudo" />
    </div>
  );
}
