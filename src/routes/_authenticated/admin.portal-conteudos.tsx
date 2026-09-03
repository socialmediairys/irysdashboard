import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { PortalConteudosManager } from "@/components/portal/PortalConteudosManager";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/portal-conteudos")({
  head: () => ({
    meta: [
      { title: "Gerenciar portais dos clientes — Irys OS" },
      { name: "description", content: "Gerencie os conteúdos do portal de cada cliente em um só lugar." },
    ],
  }),
  component: PortalConteudosPage,
});

type ClienteRef = { id: string; nome: string };

function PortalConteudosPage() {
  const [clientes, setClientes] = useState<ClienteRef[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("clientes").select("id, nome").order("nome");
      setClientes((data ?? []) as ClienteRef[]);
      if (data && data.length > 0) setSelectedId((prev) => prev ?? data[0].id);
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) return <div className="p-2 text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div>
      <PageHeader
        title="Gerenciar portais"
        description="Atalho geral: escolha um cliente para gerenciar o portal dele. No dia a dia, prefira entrar pelo perfil do cliente — a mesma tela vive em Clientes › Perfil › Portal."
      />

      <div className="space-y-6">
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full md:min-w-[240px] md:flex-1">
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <Select value={selectedId ?? ""} onValueChange={(v) => setSelectedId(v)}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedId && (
              <Link
                to="/admin/clientes/$clienteId"
                params={{ clienteId: selectedId }}
                search={{ tab: "dados" as const }}
                className="inline-flex items-center gap-1 text-sm font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                Abrir perfil completo <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.6} />
              </Link>
            )}
          </div>
        </div>

        {!selectedId && (
          <div className="text-sm text-muted-foreground">Selecione um cliente para gerenciar os conteúdos.</div>
        )}

        {selectedId && <PortalConteudosManager clienteId={selectedId} />}
      </div>
    </div>
  );
}
