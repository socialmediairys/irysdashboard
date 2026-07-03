import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Shield, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/equipe")({
  head: () => ({ meta: [{ title: "Equipe & Papéis — Irys OS" }] }),
  component: EquipePage,
});

type Papel = "admin" | "gestor" | "editor" | "social" | "financeiro" | "juridico" | "cliente";
const PAPEIS: Papel[] = ["admin", "gestor", "editor", "social", "financeiro", "juridico", "cliente"];

const CORES: Record<Papel, string> = {
  admin: "bg-[#2C1505] text-white",
  gestor: "bg-[#7A4A18] text-white",
  editor: "bg-[#C9A46E] text-[#2C1505]",
  social: "bg-pink-600 text-white",
  financeiro: "bg-emerald-700 text-white",
  juridico: "bg-indigo-700 text-white",
  cliente: "bg-slate-500 text-white",
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
    <div className="min-h-screen bg-[#EDEAE5]">
      <header className="bg-[#2C1505] text-white px-6 py-4 flex items-center gap-3">
        <Link to="/admin/visao-geral" className="text-[#C9A46E] hover:text-white flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <span className="text-[#7A6050]">|</span>
        <Users className="w-5 h-5 text-[#C9A46E]" />
        <div>
          <h1 className="text-lg font-bold">Equipe & Papéis</h1>
          <p className="text-xs text-[#C9A46E]">{membros.length} usuários no sistema</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Card className="p-4 bg-white border-[#E8D8C0]">
          <div className="flex items-start gap-2 text-sm text-[#7A4A18]">
            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              Papéis controlam o acesso às áreas do sistema. Um usuário pode ter vários papéis.
              O papel <b>cliente</b> é atribuído automaticamente no cadastro.
            </p>
          </div>
        </Card>

        {loading ? (
          <Card className="p-8 text-center text-[#7A6050]">Carregando membros...</Card>
        ) : (
          <div className="space-y-3">
            {membros.map((m) => (
              <Card key={m.id} className="p-4 bg-white border-[#E8D8C0]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-[#2C1505]">{m.nome || "(sem nome)"}</p>
                    <p className="text-xs text-[#7A6050]">{m.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {m.papeis.length === 0 && (
                    <span className="text-xs text-[#BBA898] italic">Sem papéis atribuídos</span>
                  )}
                  {m.papeis.map((p) => (
                    <Badge
                      key={p}
                      className={`${CORES[p]} hover:opacity-90 gap-1 cursor-pointer`}
                      onClick={() => removerPapel(m.id, p)}
                    >
                      {p}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 border-t pt-3">
                  <span className="text-xs text-[#7A6050] self-center mr-2">+ Atribuir:</span>
                  {PAPEIS.filter((p) => !m.papeis.includes(p)).map((p) => (
                    <button
                      key={p}
                      onClick={() => adicionarPapel(m.id, p)}
                      className="text-xs px-2 py-1 rounded border border-[#E8D8C0] text-[#7A4A18] hover:bg-[#F5EEE5] cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
