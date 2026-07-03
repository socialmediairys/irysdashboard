import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, TrendingUp, TrendingDown, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Irys OS" }] }),
  component: FinanceiroPage,
});

type Mov = {
  id: string;
  descricao: string;
  categoria: string | null;
  valor: number;
  data_ref: string;
  status_pagamento?: string;
  recorrente?: boolean;
};

function FinanceiroPage() {
  const [entradas, setEntradas] = useState<Mov[]>([]);
  const [saidas, setSaidas] = useState<Mov[]>([]);
  const [aba, setAba] = useState<"entradas" | "saidas">("entradas");
  const [form, setForm] = useState({ descricao: "", categoria: "", valor: "" });

  async function carregar() {
    const [{ data: e }, { data: s }] = await Promise.all([
      supabase.from("entradas_financeiras").select("*").order("data_ref", { ascending: false }),
      supabase.from("saidas_financeiras").select("*").order("data_ref", { ascending: false }),
    ]);
    setEntradas((e as Mov[]) ?? []);
    setSaidas((s as Mov[]) ?? []);
  }
  useEffect(() => { void carregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descricao || !form.valor) return;
    const tabela = aba === "entradas" ? "entradas_financeiras" : "saidas_financeiras";
    await supabase.from(tabela).insert({
      descricao: form.descricao,
      categoria: form.categoria || null,
      valor: Number(form.valor),
    });
    setForm({ descricao: "", categoria: "", valor: "" });
    void carregar();
  }
  async function apagar(tabela: "entradas_financeiras" | "saidas_financeiras", id: string) {
    if (!confirm("Apagar movimentação?")) return;
    await supabase.from(tabela).delete().eq("id", id);
    void carregar();
  }

  const totalE = entradas.reduce((a, b) => a + Number(b.valor), 0);
  const totalS = saidas.reduce((a, b) => a + Number(b.valor), 0);
  const saldo = totalE - totalS;
  const lista = aba === "entradas" ? entradas : saidas;

  return (
    <div className="min-h-screen bg-[#EDEAE5]">
      <header className="bg-[#2C1505] text-white px-6 py-4 flex items-center gap-3">
        <Link to="/admin/visao-geral" className="text-[#C9A46E] hover:text-white flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <span className="text-[#7A6050]">|</span>
        <CreditCard className="w-5 h-5 text-[#C9A46E]" />
        <h1 className="text-lg font-bold">Financeiro</h1>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 bg-white border-[#E8D8C0]">
            <div className="flex items-center gap-2 text-emerald-700 text-sm"><TrendingUp className="w-4 h-4" /> Entradas</div>
            <p className="text-2xl font-bold text-[#2C1505] mt-1">R$ {totalE.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </Card>
          <Card className="p-4 bg-white border-[#E8D8C0]">
            <div className="flex items-center gap-2 text-red-700 text-sm"><TrendingDown className="w-4 h-4" /> Saídas</div>
            <p className="text-2xl font-bold text-[#2C1505] mt-1">R$ {totalS.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </Card>
          <Card className={`p-4 border-[#E8D8C0] ${saldo >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
            <div className="text-sm text-[#7A4A18]">Saldo</div>
            <p className={`text-2xl font-bold mt-1 ${saldo >= 0 ? "text-emerald-800" : "text-red-800"}`}>
              R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </Card>
        </div>

        <div className="flex gap-2">
          {(["entradas", "saidas"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`px-4 py-2 rounded-full text-sm cursor-pointer ${
                aba === a ? "bg-[#2C1505] text-white" : "bg-white text-[#7A4A18] border border-[#E8D8C0]"
              }`}
            >
              {a === "entradas" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>

        <Card className="p-5 bg-white border-[#E8D8C0]">
          <form onSubmit={criar} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
            </div>
            <div className="md:col-span-4">
              <Button className="bg-[#2C1505] hover:bg-[#7A4A18] text-white">
                Registrar {aba === "entradas" ? "entrada" : "saída"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="bg-white border-[#E8D8C0] overflow-hidden">
          {lista.length === 0 ? (
            <div className="p-8 text-center text-[#7A6050]">Sem lançamentos.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F5EEE5] text-[#7A4A18] text-left">
                <tr>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Descrição</th>
                  <th className="px-4 py-2">Categoria</th>
                  <th className="px-4 py-2 text-right">Valor</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((m) => (
                  <tr key={m.id} className="border-t border-[#F0E4D3]">
                    <td className="px-4 py-2 text-[#7A6050]">{new Date(m.data_ref).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-2 text-[#2C1505]">{m.descricao}</td>
                    <td className="px-4 py-2 text-[#7A6050]">{m.categoria || "—"}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${aba === "entradas" ? "text-emerald-700" : "text-red-700"}`}>
                      R$ {Number(m.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => apagar(aba === "entradas" ? "entradas_financeiras" : "saidas_financeiras", m.id)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
