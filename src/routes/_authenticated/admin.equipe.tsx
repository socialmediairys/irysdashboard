import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Shield, Users, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/equipe")({
  head: () => ({ meta: [{ title: "Equipe & Papéis — Irys OS" }] }),
  component: EquipePage,
});

type Papel = "admin" | "gestor" | "editor" | "social" | "financeiro" | "juridico" | "cliente";
const PAPEIS: Papel[] = ["admin", "gestor", "editor", "social", "financeiro", "juridico", "cliente"];

/** Papéis usam a escala neutra do design system; só admin recebe destaque. */
const VARIANTES: Record<Papel, StatusVariant> = {
  admin: "primary",
  gestor: "info",
  editor: "neutral",
  social: "neutral",
  financeiro: "neutral",
  juridico: "neutral",
  cliente: "neutral",
};

type Membro = { id: string; nome: string | null; email: string | null; papeis: Papel[] };

function EquipePage() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setLoading(true);
    const { data: profs } = await supabase.from("profiles").select("id, nome, email");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const map = new Map<string, Membro>();
    (profs ?? []).forEach((p) =>
      map.set(p.id, { id: p.id, nome: p.nome, email: p.email, papeis: [] }),
    );
    (roles ?? []).forEach((r) => {
      const m = map.get(r.user_id);
      if (m) m.papeis.push(r.role as Papel);
    });
    setMembros(Array.from(map.values()));
    setLoading(false);
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function adicionarPapel(userId: string, papel: Papel) {
    await supabase.from("user_roles").insert({ user_id: userId, role: papel });
    await carregar();
  }
  async function removerPapel(userId: string, papel: Papel) {
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", papel);
    await carregar();
  }

  return (
    <div>
      <PageHeader
        title="Equipe & Papéis"
        description={`${membros.length} usuários no sistema`}
      />

      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
          <p>
            Papéis controlam o acesso às áreas do sistema. Um usuário pode ter vários papéis.
            O papel <b className="text-foreground">cliente</b> é atribuído automaticamente no cadastro.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
            Carregando membros…
          </div>
        ) : membros.length === 0 ? (
          <EmptyState
            title="Nenhum usuário encontrado"
            description="Assim que alguém acessar o sistema, aparecerá aqui."
            icon={<Users size={24} strokeWidth={1.6} />}
          />
        ) : (
          <div className="space-y-3">
            {membros.map((m) => (
              <div key={m.id} className="rounded-2xl bg-card p-5 shadow-card">
                <div className="mb-3">
                  <p className="font-semibold text-foreground">{m.nome || "(sem nome)"}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {m.papeis.length === 0 && (
                    <span className="text-xs italic text-muted-foreground">Sem papéis atribuídos</span>
                  )}
                  {m.papeis.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => removerPapel(m.id, p)}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      aria-label={`Remover papel ${p}`}
                    >
                      <StatusBadge variant={VARIANTES[p]} dot={false}>
                        <span className="inline-flex items-center gap-1">
                          {p}
                          <X className="h-3 w-3" strokeWidth={1.6} />
                        </span>
                      </StatusBadge>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                  <span className="mr-2 self-center text-xs text-muted-foreground">+ Atribuir:</span>
                  {PAPEIS.filter((p) => !m.papeis.includes(p)).map((p) => (
                    <button
                      key={p}
                      onClick={() => adicionarPapel(m.id, p)}
                      className="cursor-pointer rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
