import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PortalConteudoDetalhe } from "@/components/portal/PortalConteudosEditoriais";

export const Route = createFileRoute("/_authenticated/meu-portal_/conteudo/$conteudoId")({
  head: () => ({ meta: [{ title: "Conteúdo — Meu portal Irys" }, { name: "description", content: "Ideia, produção e histórico de aprovação do seu conteúdo no Irys." }, { property: "og:title", content: "Conteúdo — Meu portal Irys" }, { property: "og:description", content: "Ideia, produção e histórico de aprovação do seu conteúdo no Irys." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PortalConteudoPage,
});

function PortalConteudoPage() {
  const { conteudoId } = Route.useParams();
  // cliente vem da sessão (RPC no banco), nunca da URL
  const { data: clienteId, isLoading } = useQuery({
    queryKey: ["current-cliente-id"],
    queryFn: async () => (await supabase.rpc("current_cliente_id")).data ?? null,
    staleTime: 5 * 60_000,
  });
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
        <Link to="/meu-portal" className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground">Portal exclusivo</Link>
      </header>
      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p>
          : clienteId ? <PortalConteudoDetalhe clienteId={clienteId} conteudoId={conteudoId} />
          : <p className="text-sm text-muted-foreground">Este acesso não está vinculado a um portal de cliente. <Link to="/app" className="underline">Continuar</Link></p>}
      </main>
    </div>
  );
}
