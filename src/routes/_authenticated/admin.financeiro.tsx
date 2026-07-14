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
import { FinanceiroCharts } from "@/components/charts/FinanceiroCharts";

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
  is_fixed?: boolean;
  conta_fixa_id?: string | null;
};

type ContaFixa = {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  categoria: string | null;
  frequencia: string;
  dia_vencimento: number;
  data_inicio: string;
  data_fim: string | null;
  ativo: boolean;
};

type Filtro = "todas" | "fixas" | "variaveis";
type Aba = "entradas" | "saidas" | "contas_fixas";

function lastDayOfMonth(y: number, m0: number) {
  return new Date(y, m0 + 1, 0).getDate();
}

function dateForMonth(y: number, m0: number, day: number): string {
  const d = Math.min(day, lastDayOfMonth(y, m0));
  return `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Generate up to 12 monthly occurrences starting from data_inicio's month
async function gerarOcorrencias(conta: ContaFixa) {
  const tabela: Tabela = conta.tipo === "receita" ? "entradas_financeiras" : "saidas_financeiras";
  const inicio = new Date(conta.data_inicio + "T00:00:00");
  const fim = conta.data_fim ? new Date(conta.data_fim + "T00:00:00") : null;

  const rows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 12; i++) {
    const y = inicio.getFullYear();
    const m0 = inicio.getMonth() + i;
    const dataRef = dateForMonth(
      new Date(y, m0, 1).getFullYear(),
      new Date(y, m0, 1).getMonth(),
      conta.dia_vencimento,
    );
    if (fim && new Date(dataRef) > fim) break;
    rows.push({
      descricao: conta.descricao,
      categoria: conta.categoria,
      valor: conta.valor,
      data_ref: dataRef,
      conta_fixa_id: conta.id,
      is_fixed: true,
      recurrence_day: conta.dia_vencimento,
    });
  }
  if (rows.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from(tabela).insert(rows as any);
}

function FinanceiroPage() {
  const [entradas, setEntradas] = useState<Mov[]>([]);
  const [saidas, setSaidas] = useState<Mov[]>([]);
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>([]);
  const [aba, setAba] = useState<Aba>("entradas");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [form, setForm] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    recorrente: false,
    dia_vencimento: "",
    data_inicio: new Date().toISOString().slice(0, 10),
    data_fim: "",
  });

  const carregar = useCallback(async () => {
    const [{ data: e }, { data: s }, { data: cf }] = await Promise.all([
      supabase.from("entradas_financeiras").select("*").order("data_ref", { ascending: false }),
      supabase.from("saidas_financeiras").select("*").order("data_ref", { ascending: false }),
      supabase.from("contas_fixas").select("*").order("created_at", { ascending: false }),
    ]);
    setEntradas((e as Mov[]) ?? []);
    setSaidas((s as Mov[]) ?? []);
    setContasFixas((cf as ContaFixa[]) ?? []);
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descricao || !form.valor) return;
    const tipo: "receita" | "despesa" = aba === "entradas" ? "receita" : "despesa";

    if (form.recorrente) {
      const dia = Number(form.dia_vencimento);
      if (!dia || dia < 1 || dia > 31) {
        alert("Informe um dia de vencimento entre 1 e 31.");
        return;
      }
      const { data, error } = await supabase
        .from("contas_fixas")
        .insert({
          descricao: form.descricao,
          categoria: form.categoria || null,
          valor: Number(form.valor),
          tipo,
          frequencia: "mensal",
          dia_vencimento: dia,
          data_inicio: form.data_inicio,
          data_fim: form.data_fim || null,
          ativo: true,
        })
        .select()
        .single();
      if (error || !data) {
        alert("Erro ao criar conta fixa: " + (error?.message ?? ""));
        return;
      }
      await gerarOcorrencias(data as ContaFixa);
    } else {
      const tabela: Tabela = aba === "entradas" ? "entradas_financeiras" : "saidas_financeiras";
      await supabase.from(tabela).insert({
        descricao: form.descricao,
        categoria: form.categoria || null,
        valor: Number(form.valor),
        data_ref: form.data_inicio,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }
    setForm({
      descricao: "", categoria: "", valor: "",
      recorrente: false, dia_vencimento: "",
      data_inicio: new Date().toISOString().slice(0, 10),
      data_fim: "",
    });
    void carregar();
  }

  async function apagarLancamento(tabela: Tabela, id: string) {
    if (!confirm("Apagar movimentação?")) return;
    await supabase.from(tabela).delete().eq("id", id);
    void carregar();
  }

  async function apagarContaFixa(conta: ContaFixa) {
    const escolha = window.prompt(
      `Excluir "${conta.descricao}". Digite:\n"futuras" — remover só as ocorrências futuras\n"todas" — remover todas as ocorrências (incluindo passadas)\n(cancelar deixa em branco)`,
      "futuras",
    );
    if (!escolha) return;
    const tabela: Tabela = conta.tipo === "receita" ? "entradas_financeiras" : "saidas_financeiras";
    const hoje = new Date().toISOString().slice(0, 10);
    if (escolha === "todas") {
      await supabase.from(tabela).delete().eq("conta_fixa_id", conta.id);
    } else {
      await supabase.from(tabela).delete().eq("conta_fixa_id", conta.id).gte("data_ref", hoje);
    }
    await supabase.from("contas_fixas").delete().eq("id", conta.id);
    void carregar();
  }

  const totalE = entradas.reduce((a, b) => a + Number(b.valor), 0);
  const totalS = saidas.reduce((a, b) => a + Number(b.valor), 0);
  const saldo = totalE - totalS;

  const listaBase = aba === "entradas" ? entradas : aba === "saidas" ? saidas : [];
  const lista = listaBase.filter((m) => {
    const isRec = !!m.conta_fixa_id || !!m.is_fixed;
    if (filtro === "fixas") return isRec;
    if (filtro === "variaveis") return !isRec;
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

        <FinanceiroCharts entradas={entradas} saidas={saidas} />

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            {([
              ["entradas", "Entradas"],
              ["saidas", "Saídas"],
              ["contas_fixas", "Contas fixas"],
            ] as const).map(([a, label]) => (
              <button
                key={a}
                onClick={() => setAba(a)}
                className={`px-4 py-2 rounded-full text-sm cursor-pointer ${
                  aba === a ? "bg-[#2C1505] text-white" : "bg-white text-[#7A4A18] border border-[#E8D8C0]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {aba !== "contas_fixas" && (
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
          )}
        </div>

        {aba !== "contas_fixas" && (
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
                  id="recorrente"
                  checked={form.recorrente}
                  onCheckedChange={(v) => setForm({ ...form, recorrente: v })}
                />
                <Label htmlFor="recorrente" className="cursor-pointer flex items-center gap-1">
                  <Repeat className="w-4 h-4" /> Conta fixa (recorrente mensal)
                </Label>
              </div>

              {form.recorrente ? (
                <>
                  <div>
                    <Label>Dia de vencimento (1–31)</Label>
                    <Input
                      type="number" min={1} max={31}
                      value={form.dia_vencimento}
                      onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Data de início</Label>
                    <Input
                      type="date"
                      value={form.data_inicio}
                      onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Data de término (opcional)</Label>
                    <Input
                      type="date"
                      value={form.data_fim}
                      onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                  />
                </div>
              )}

              <div className="md:col-span-4">
                <Button className="bg-[#2C1505] hover:bg-[#7A4A18] text-white">
                  {form.recorrente
                    ? `Criar conta fixa (${aba === "entradas" ? "entrada" : "saída"})`
                    : `Registrar ${aba === "entradas" ? "entrada" : "saída"}`}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {aba === "contas_fixas" ? (
          <Card className="bg-white border-[#E8D8C0] overflow-hidden">
            {contasFixas.length === 0 ? (
              <div className="p-8 text-center text-[#7A6050]">Nenhuma conta fixa cadastrada.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#F5EEE5] text-[#7A4A18] text-left">
                  <tr>
                    <th className="px-4 py-2">Descrição</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Categoria</th>
                    <th className="px-4 py-2">Dia venc.</th>
                    <th className="px-4 py-2">Início</th>
                    <th className="px-4 py-2">Término</th>
                    <th className="px-4 py-2 text-right">Valor</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {contasFixas.map((c) => (
                    <tr key={c.id} className="border-t border-[#F0E4D3]">
                      <td className="px-4 py-2 text-[#2C1505]">{c.descricao}</td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary" className={c.tipo === "receita" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                          {c.tipo}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-[#7A6050]">{c.categoria || "—"}</td>
                      <td className="px-4 py-2 text-[#7A6050]">{c.dia_vencimento}</td>
                      <td className="px-4 py-2 text-[#7A6050]">{new Date(c.data_inicio).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-2 text-[#7A6050]">{c.data_fim ? new Date(c.data_fim).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="px-4 py-2 text-right font-semibold text-[#2C1505]">
                        R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => apagarContaFixa(c)} className="text-red-600 hover:text-red-800 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        ) : (
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
                  {lista.map((m) => {
                    const isRec = !!m.conta_fixa_id || !!m.is_fixed;
                    return (
                      <tr key={m.id} className="border-t border-[#F0E4D3]">
                        <td className="px-4 py-2 text-[#7A6050]">{new Date(m.data_ref).toLocaleDateString("pt-BR")}</td>
                        <td className="px-4 py-2 text-[#2C1505]">{m.descricao}</td>
                        <td className="px-4 py-2 text-[#7A6050]">{m.categoria || "—"}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${aba === "entradas" ? "text-emerald-700" : "text-red-700"}`}>
                          <div className="flex items-center justify-end gap-2">
                            <span>R$ {Number(m.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            {isRec && (
                              <Badge variant="secondary" className="gap-1 bg-[#F0E4D3] text-[#7A4A18] border-[#E8D8C0]">
                                <Repeat className="w-3 h-3" /> Recorrente
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => apagarLancamento(aba === "entradas" ? "entradas_financeiras" : "saidas_financeiras", m.id)}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
