import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, TrendingUp, TrendingDown, Trash2, Repeat } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Irys OS" }] }),
  component: FinanceiroPage,
});

type Tabela = "entradas_financeiras" | "saidas_financeiras";

type Mov = {
  id: string;
  descricao: string;
  categoria: string | null;
  valor: number;
  data_ref: string;
  status_pagamento?: string;
  recorrente?: boolean;
  is_fixed?: boolean;
  recurrence_day?: number | null;
  fixed_template_id?: string | null;
};

type Filtro = "todas" | "fixas" | "variaveis";

function lastDayOfMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function targetDateForRecurrence(day: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const useDay = Math.min(day, lastDayOfMonth(y, m));
  const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(useDay).padStart(2, "0")}`;
  return iso;
}

async function gerarRecorrenciasDoMes(tabela: Tabela) {
  const { data: modelos, error } = await supabase
    .from(tabela)
    .select("*")
    .eq("is_fixed", true)
    .is("fixed_template_id", null);
  if (error || !modelos) return;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);

  for (const m of modelos as Mov[]) {
    if (!m.recurrence_day) continue;
    const { data: existente } = await supabase
      .from(tabela)
      .select("id")
      .eq("fixed_template_id", m.id)
      .gte("data_ref", start)
      .lt("data_ref", end)
      .maybeSingle();
    if (existente) continue;

    await supabase.from(tabela).insert({
      descricao: m.descricao,
      categoria: m.categoria,
      valor: m.valor,
      data_ref: targetDateForRecurrence(m.recurrence_day),
      is_fixed: true,
      recurrence_day: m.recurrence_day,
      fixed_template_id: m.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }
}

function FinanceiroPage() {
  const [entradas, setEntradas] = useState<Mov[]>([]);
  const [saidas, setSaidas] = useState<Mov[]>([]);
  const [aba, setAba] = useState<"entradas" | "saidas">("entradas");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [form, setForm] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    is_fixed: false,
    recurrence_day: "",
  });

  const carregar = useCallback(async () => {
    // Geração idempotente antes de listar
    await Promise.all([
      gerarRecorrenciasDoMes("entradas_financeiras"),
      gerarRecorrenciasDoMes("saidas_financeiras"),
    ]);
    const [{ data: e }, { data: s }] = await Promise.all([
      supabase.from("entradas_financeiras").select("*").order("data_ref", { ascending: false }),
      supabase.from("saidas_financeiras").select("*").order("data_ref", { ascending: false }),
    ]);
    setEntradas((e as Mov[]) ?? []);
    setSaidas((s as Mov[]) ?? []);
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descricao || !form.valor) return;
    const tabela: Tabela = aba === "entradas" ? "entradas_financeiras" : "saidas_financeiras";
    const day = form.is_fixed ? Number(form.recurrence_day) : null;
    if (form.is_fixed && (!day || day < 1 || day > 31)) {
      alert("Informe um dia de vencimento entre 1 e 31.");
      return;
    }
    const payload: Record<string, unknown> = {
      descricao: form.descricao,
      categoria: form.categoria || null,
      valor: Number(form.valor),
      is_fixed: form.is_fixed,
      recurrence_day: day,
      fixed_template_id: null,
    };
    if (form.is_fixed && day) {
      payload.data_ref = targetDateForRecurrence(day);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from(tabela).insert(payload as any);
    setForm({ descricao: "", categoria: "", valor: "", is_fixed: false, recurrence_day: "" });
    void carregar();
  }

  async function apagar(tabela: Tabela, id: string) {
    if (!confirm("Apagar movimentação?")) return;
    await supabase.from(tabela).delete().eq("id", id);
    void carregar();
  }

  const totalE = entradas.reduce((a, b) => a + Number(b.valor), 0);
  const totalS = saidas.reduce((a, b) => a + Number(b.valor), 0);
  const saldo = totalE - totalS;
  const listaBase = aba === "entradas" ? entradas : saidas;
  const lista = listaBase.filter((m) => {
    if (filtro === "fixas") return m.is_fixed === true;
    if (filtro === "variaveis") return !m.is_fixed;
    return true;
  });

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

        <div className="flex flex-wrap gap-2 items-center justify-between">
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
          <div className="flex gap-2">
            {([
              ["todas", "Todas"],
              ["fixas", "Só fixas"],
              ["variaveis", "Só variáveis"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFiltro(k)}
                className={`px-3 py-1.5 rounded-full text-xs cursor-pointer ${
                  filtro === k ? "bg-[#7A4A18] text-white" : "bg-white text-[#7A4A18] border border-[#E8D8C0]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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

            <div className="md:col-span-2 flex items-center gap-3 pt-1">
              <Switch
                id="is_fixed"
                checked={form.is_fixed}
                onCheckedChange={(v) => setForm({ ...form, is_fixed: v })}
              />
              <Label htmlFor="is_fixed" className="cursor-pointer flex items-center gap-1">
                <Repeat className="w-4 h-4" /> Conta fixa (recorrente mensal)
              </Label>
            </div>
            {form.is_fixed && (
              <div>
                <Label>Dia de vencimento (1–31)</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={form.recurrence_day}
                  onChange={(e) => setForm({ ...form, recurrence_day: e.target.value })}
                />
              </div>
            )}

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
                      <div className="flex items-center justify-end gap-2">
                        <span>R$ {Number(m.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        {m.is_fixed && (
                          <Badge variant="secondary" className="gap-1 bg-[#F0E4D3] text-[#7A4A18] border-[#E8D8C0]">
                            <Repeat className="w-3 h-3" /> Fixa
                          </Badge>
                        )}
                      </div>
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
