import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentModule } from "@/components/content/ContentModule";

export const Route = createFileRoute("/_authenticated/admin/conteudo")({
  head: () => ({
    meta: [
      { title: "Conteúdo — Irys" },
      { name: "description", content: "Calendário, produção, aprovação e publicação dos conteúdos editoriais." },
      { property: "og:title", content: "Conteúdo — Irys" },
      { property: "og:description", content: "Calendário, produção, aprovação e publicação dos conteúdos editoriais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: z.object({ c: z.string().optional() }),
  component: ConteudoRoute,
});

function ConteudoRoute() {
  const { c } = Route.useSearch();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Conteúdo"
        description="Da estratégia à publicação — todos os conteúdos editoriais em um só lugar."
        actions={
          <Link to="/admin/portal-conteudos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            Materiais do portal <ExternalLink size={14} strokeWidth={1.6} />
          </Link>
        }
      />
      <ContentModule key={c ?? "all"} initialOpenId={c} />
    </div>
  );
}
