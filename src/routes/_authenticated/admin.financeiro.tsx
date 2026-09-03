import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, Thead, Tbody, Tr, Th, Td } from "@/components/ui/data-table";
import { CreditCard, TrendingUp, TrendingDown, Trash2, Repeat } from "lucide-react";
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
    <>
      <PageHeader
        title="Financeiro"
        description="Entradas, saídas e contas fixas da organização."
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            label="Entradas"
            icon={TrendingUp}
            value={`R$ ${totalE.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          />
          <MetricCard
            label="Saídas"
            icon={TrendingDown}
            value={`R$ ${totalS.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          />
          <MetricCard
            label="Saldo"
            icon={CreditCard}
            value={`R$ ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            hint={saldo >= 0 ? "Saldo positivo" : "Saldo negativo"}
          />
        </div>

        <FinanceiroCharts entradas={entradas} saidas={saidas} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {([
              ["entradas", "Entradas"],
              ["saidas", "Saídas"],
              ["contas_fixas", "Contas fixas"],
            ] as const).map(([a, label]) => (
              <button
                key={a}
                onClick={() => setAba(a)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm transition-colors ${
                  aba === a
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
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
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs transition-colors ${
                    filtro === k
                      ? "bg-secondary font-semibold text-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {aba !== "contas_fixas" && (
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <form onSubmit={criar} className="grid grid-cols-1 gap-3 md:grid-cols-4">
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

              <div className="flex items-center gap-3 pt-1 md:col-span-2">
                <Switch
                  id="recorrente"
                  checked={form.recorrente}
                  onCheckedChange={(v) => setForm({ ...form, recorrente: v })}
                />
                <Label htmlFor="recorrente" className="flex cursor-pointer items-center gap-1">
                  <Repeat size={16} strokeWidth={1.6} /> Conta fixa (recorrente mensal)
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
                <Button>
                  {form.recorrente
                    ? `Criar conta fixa (${aba === "entradas" ? "entrada" : "saída"})`
                    : `Registrar ${aba === "entradas" ? "entrada" : "saída"}`}
                </Button>
              </div>
            </form>
          </div>
        )}

        {aba === "contas_fixas" ? (
          contasFixas.length === 0 ? (
            <EmptyState
              icon={<Repeat size={24} strokeWidth={1.6} />}
              title="Nenhuma conta fixa cadastrada"
              description="Crie um lançamento marcado como recorrente para gerar contas fixas."
            />
          ) : (
            <DataTable>
              <Thead>
                <Th>Descrição</Th>
                <Th>Tipo</Th>
                <Th>Categoria</Th>
                <Th>Dia venc.</Th>
                <Th>Início</Th>
                <Th>Término</Th>
                <Th align="right">Valor</Th>
                <Th />
              </Thead>
              <Tbody>
                {contasFixas.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-medium text-foreground">{c.descricao}</Td>
                    <Td>
                      <StatusBadge variant={c.tipo === "receita" ? "success" : "neutral"}>
                        {c.tipo === "receita" ? "Receita" : "Despesa"}
                      </StatusBadge>
                    </Td>
                    <Td className="text-muted-foreground">{c.categoria || "—"}</Td>
                    <Td className="text-muted-foreground">{c.dia_vencimento}</Td>
                    <Td className="text-muted-foreground">{new Date(c.data_inicio).toLocaleDateString("pt-BR")}</Td>
                    <Td className="text-muted-foreground">{c.data_fim ? new Date(c.data_fim).toLocaleDateString("pt-BR") : "—"}</Td>
                    <Td align="right" className="font-semibold text-foreground">
                      R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Td>
                    <Td align="right">
                      <button
                        onClick={() => apagarContaFixa(c)}
                        aria-label="Excluir conta fixa"
                        className="cursor-pointer text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 size={16} strokeWidth={1.6} />
                      </button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </DataTable>
          )
        ) : lista.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={24} strokeWidth={1.6} />}
            title="Sem lançamentos"
            description="Registre uma movimentação usando o formulário acima."
          />
        ) : (
          <DataTable>
            <Thead>
              <Th>Data</Th>
              <Th>Descrição</Th>
              <Th>Categoria</Th>
              <Th align="right">Valor</Th>
              <Th />
            </Thead>
            <Tbody>
              {lista.map((m) => {
                const isRec = !!m.conta_fixa_id || !!m.is_fixed;
                return (
                  <Tr key={m.id}>
                    <Td className="text-muted-foreground">{new Date(m.data_ref).toLocaleDateString("pt-BR")}</Td>
                    <Td className="font-medium text-foreground">{m.descricao}</Td>
                    <Td className="text-muted-foreground">{m.categoria || "—"}</Td>
                    <Td align="right" className="font-semibold text-foreground">
                      <div className="flex items-center justify-end gap-2">
                        <span>R$ {Number(m.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        {isRec && (
                          <StatusBadge variant="neutral" dot={false}>
                            <Repeat size={12} strokeWidth={1.6} /> Recorrente
                          </StatusBadge>
                        )}
                      </div>
                    </Td>
                    <Td align="right">
                      <button
                        onClick={() => apagarLancamento(aba === "entradas" ? "entradas_financeiras" : "saidas_financeiras", m.id)}
                        aria-label="Apagar movimentação"
                        className="cursor-pointer text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 size={16} strokeWidth={1.6} />
                      </button>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </DataTable>
        )}
      </div>
    </>
  );
}

