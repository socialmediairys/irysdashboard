import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { PortalConteudosManager } from "@/components/portal/PortalConteudosManager";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/portal-conteudos")({
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

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold break-words">Gerenciar portais (todos os clientes)</h1>
        <p className="text-sm text-muted-foreground">
          Atalho geral: escolha um cliente na lista abaixo para gerenciar o portal dele. No dia a dia, prefira entrar pelo perfil de cada cliente — a mesma tela vive dentro de <em>Clientes › Perfil › Portal — Gerenciar conteúdo</em>.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full md:flex-1 md:min-w-[240px]">
            <Label className="text-xs">Cliente</Label>
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
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline"
            >
              Abrir perfil completo <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </Card>

      {!selectedId && (
        <div className="text-sm text-muted-foreground">Selecione um cliente para gerenciar os conteúdos.</div>
      )}

      {selectedId && <PortalConteudosManager clienteId={selectedId} />}
    </div>
  );
}
