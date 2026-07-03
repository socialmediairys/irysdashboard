import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/crm")({
  head: () => ({ meta: [{ title: "CRM & Pipeline — Irys OS" }] }),
  component: CrmPage,
});

type Lead = {
  id: string;
  nome: string;
  valor: number;
  status: string;
  origem: string | null;
  potencial: string | null;
  observacoes: string | null;
  created_at: string;
};

const STATUS = ["frio", "quente", "negociando", "proposta", "ganho", "perdido"];
const CORES_STATUS: Record<string, string> = {
  frio: "bg-slate-200 text-slate-700",
  quente: "bg-orange-200 text-orange-800",
  negociando: "bg-blue-200 text-blue-800",
  proposta: "bg-purple-200 text-purple-800",
  ganho: "bg-emerald-200 text-emerald-800",
  perdido: "bg-red-200 text-red-800",
};

function CrmPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [novo, setNovo] = useState({ nome: "", valor: "", origem: "", potencial: "Médio" });

  async function carregar() {
    setLoading(true);
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void carregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!novo.nome) return;
    await supabase.from("leads").insert({
      nome: novo.nome,
      valor: Number(novo.valor) || 0,
      origem: novo.origem || null,
      potencial: novo.potencial,
      status: "frio",
    });
    setNovo({ nome: "", valor: "", origem: "", potencial: "Médio" });
    void carregar();
  }
  async function mudarStatus(id: string, status: string) {
    await supabase.from("leads").update({ status }).eq("id", id);
    void carregar();
  }
  async function apagar(id: string) {
    if (!confirm("Apagar este lead?")) return;
    await supabase.from("leads").delete().eq("id", id);
    void carregar();
  }

  const totalPipeline = leads
    .filter((l) => !["ganho", "perdido"].includes(l.status))
    .reduce((a, b) => a + Number(b.valor || 0), 0);
  const ganhos = leads.filter((l) => l.status === "ganho").reduce((a, b) => a + Number(b.valor || 0), 0);

  return (
    <div className="min-h-screen bg-[#EDEAE5]">
      <header className="bg-[#2C1505] text-white px-6 py-4 flex items-center gap-3">
        <Link to="/admin/visao-geral" className="text-[#C9A46E] hover:text-white flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <span className="text-[#7A6050]">|</span>
        <TrendingUp className="w-5 h-5 text-[#C9A46E]" />
        <div>
          <h1 className="text-lg font-bold">CRM & Pipeline</h1>
          <p className="text-xs text-[#C9A46E]">
            R$ {totalPipeline.toLocaleString("pt-BR")} em pipeline · R$ {ganhos.toLocaleString("pt-BR")} ganho
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <Card className="p-5 bg-white border-[#E8D8C0]">
          <h2 className="text-sm font-semibold text-[#2C1505] mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo lead
          </h2>
          <form onSubmit={criar} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <Label>Nome / Empresa</Label>
              <Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" value={novo.valor} onChange={(e) => setNovo({ ...novo, valor: e.target.value })} />
            </div>
            <div>
              <Label>Origem</Label>
              <Input value={novo.origem} onChange={(e) => setNovo({ ...novo, origem: e.target.value })} placeholder="Instagram, Indicação..." />
            </div>
            <div>
              <Label>Potencial</Label>
              <select
                value={novo.potencial}
                onChange={(e) => setNovo({ ...novo, potencial: e.target.value })}
                className="w-full h-10 border border-[#E8D8C0] rounded px-3 bg-white text-[#2C1505]"
              >
                {["Baixo", "Médio", "Alto", "Altíssimo"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="md:col-span-5">
              <Button className="bg-[#2C1505] hover:bg-[#7A4A18] text-white">Adicionar lead</Button>
            </div>
          </form>
        </Card>

        {loading ? (
          <Card className="p-8 text-center text-[#7A6050]">Carregando...</Card>
        ) : leads.length === 0 ? (
          <Card className="p-8 text-center text-[#7A6050]">Nenhum lead cadastrado ainda.</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {STATUS.map((st) => {
              const filtered = leads.filter((l) => l.status === st);
              if (filtered.length === 0) return null;
              return (
                <div key={st}>
                  <h3 className="text-xs font-semibold uppercase text-[#7A4A18] mb-2 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded ${CORES_STATUS[st]}`}>{st}</span>
                    <span>{filtered.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {filtered.map((l) => (
                      <Card key={l.id} className="p-3 bg-white border-[#E8D8C0]">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#2C1505] truncate">{l.nome}</p>
                            <p className="text-sm text-emerald-700 font-semibold">
                              R$ {Number(l.valor).toLocaleString("pt-BR")}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-[#7A6050]">
                              {l.origem && <Badge className="bg-[#F5EEE5] text-[#7A4A18] hover:bg-[#F5EEE5]">{l.origem}</Badge>}
                              {l.potencial && <Badge className="bg-[#F5EEE5] text-[#7A4A18] hover:bg-[#F5EEE5]">{l.potencial}</Badge>}
                            </div>
                          </div>
                          <button onClick={() => apagar(l.id)} className="text-red-600 hover:text-red-800 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <select
                          value={l.status}
                          onChange={(e) => mudarStatus(l.id, e.target.value)}
                          className="mt-2 w-full text-xs border border-[#E8D8C0] rounded px-2 py-1 bg-white"
                        >
                          {STATUS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
