import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";

/* ---------- helpers ---------- */
export type ClienteRef = { id: string; nome: string };

export function useClientes() {
  const [clientes, setClientes] = useState<ClienteRef[]>([]);
  useEffect(() => {
    supabase.from("clientes").select("id, nome").order("nome").then(({ data }) => {
      setClientes((data ?? []) as ClienteRef[]);
    });
  }, []);
  return clientes;
}

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

/* ================================================================
 * 1. TAREFA
 * ================================================================ */
export type TarefaFormValues = {
  titulo: string;
  cliente_id: string | null;
  tipo: string;
  status: string;
  prioridade: string;
  prazo: string | null;
  descricao: string | null;
};

const TAREFA_TIPOS = ["Reels", "Carrossel", "Story", "Post Feed", "Legenda", "Design", "Vídeo", "Outro"];
const TAREFA_STATUS = ["Backlog", "Ideação", "Produção", "Revisão Interna", "Aprovação Cliente", "Agendado"];
const TAREFA_PRIORIDADE = ["Baixa", "Média", "Alta", "Urgente"];

export function TarefaForm({ value, onChange, errors }: {
  value: TarefaFormValues;
  onChange: (v: TarefaFormValues) => void;
  errors: Partial<Record<keyof TarefaFormValues, string>>;
}) {
  const clientes = useClientes();
  const set = <K extends keyof TarefaFormValues>(k: K, v: TarefaFormValues[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <Field label="Título" required error={errors.titulo}>
        <Input value={value.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex: Reels lançamento produto" />
      </Field>
      <Field label="Cliente" error={errors.cliente_id}>
        <Select value={value.cliente_id ?? ""} onValueChange={(v) => set("cliente_id", v || null)}>
          <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
          <SelectContent>
            {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Tipo">
          <Select value={value.tipo} onValueChange={(v) => set("tipo", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TAREFA_TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={value.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TAREFA_STATUS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Prioridade">
          <Select value={value.prioridade} onValueChange={(v) => set("prioridade", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TAREFA_PRIORIDADE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Prazo">
          <Input type="date" value={value.prazo ?? ""} onChange={(e) => set("prazo", e.target.value || null)} />
        </Field>
      </div>
      <Field label="Descrição">
        <Textarea rows={3} value={value.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} />
      </Field>
    </>
  );
}
export const TAREFA_DEFAULTS: TarefaFormValues = {
  titulo: "", cliente_id: null, tipo: "Outro", status: "Backlog", prioridade: "Média", prazo: null, descricao: null,
};
export function validateTarefa(v: TarefaFormValues) {
  const e: Partial<Record<keyof TarefaFormValues, string>> = {};
  if (!v.titulo.trim()) e.titulo = "Título é obrigatório";
  return e;
}

/* ================================================================
 * 2. CLIENTE
 * ================================================================ */
export type ClienteFormValues = {
  nome: string;
  plano_label: string;
  valor_mensal: number | null;
  status_contrato: string;
  email: string | null;
};
const CLIENTE_PLANOS = ["Social Media Básico", "Social Media Intermediário", "Social Media Avançado", "Parceria SM", "Material Impresso", "Outro"];
const CLIENTE_STATUS: { v: string; label: string }[] = [
  { v: "ativo", label: "Ativo" },
  { v: "pendente_assinatura", label: "Atenção / Pendente" },
  { v: "vencido", label: "Proposta / Vencido" },
  { v: "cancelado", label: "Inativo" },
];

export function ClienteForm({ value, onChange, errors }: {
  value: ClienteFormValues;
  onChange: (v: ClienteFormValues) => void;
  errors: Partial<Record<keyof ClienteFormValues, string>>;
}) {
  const set = <K extends keyof ClienteFormValues>(k: K, v: ClienteFormValues[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <Field label="Nome do cliente" required error={errors.nome}>
        <Input value={value.nome} onChange={(e) => set("nome", e.target.value)} />
      </Field>
      <Field label="Plano">
        <Select value={value.plano_label} onValueChange={(v) => set("plano_label", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CLIENTE_PLANOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Valor mensal (R$)">
          <Input type="number" step="0.01" value={value.valor_mensal ?? ""} onChange={(e) => set("valor_mensal", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Status">
          <Select value={value.status_contrato} onValueChange={(v) => set("status_contrato", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CLIENTE_STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="E-mail" error={errors.email}>
        <Input type="email" value={value.email ?? ""} onChange={(e) => set("email", e.target.value)} />
      </Field>
    </>
  );
}
export const CLIENTE_DEFAULTS: ClienteFormValues = {
  nome: "", plano_label: "Social Media Básico", valor_mensal: null, status_contrato: "pendente_assinatura", email: null,
};
export function validateCliente(v: ClienteFormValues) {
  const e: Partial<Record<keyof ClienteFormValues, string>> = {};
  if (!v.nome.trim()) e.nome = "Nome é obrigatório";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "E-mail inválido";
  return e;
}

/* ================================================================
 * 3. ESTRATÉGIA
 * ================================================================ */
export type EstrategiaFormValues = {
  cliente_id: string;
  pilares: string[];
  formatos: string[];
  qtd_entregaveis: number;
  objetivo: string | null;
};
const PILARES = ["Educativo", "Vendas", "Bastidores", "Conexão", "Autoridade", "Entretenimento"];
const FORMATOS = ["Reels", "Carrossel", "Story", "Post Feed", "Vídeo"];

function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`min-h-11 rounded-full px-4 text-sm font-medium border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function EstrategiaForm({ value, onChange, errors }: {
  value: EstrategiaFormValues;
  onChange: (v: EstrategiaFormValues) => void;
  errors: Partial<Record<keyof EstrategiaFormValues, string>>;
}) {
  const clientes = useClientes();
  const set = <K extends keyof EstrategiaFormValues>(k: K, v: EstrategiaFormValues[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <Field label="Cliente" required error={errors.cliente_id}>
        <Select value={value.cliente_id} onValueChange={(v) => set("cliente_id", v)}>
          <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
          <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Pilares de conteúdo">
        <Chips options={PILARES} value={value.pilares} onChange={(v) => set("pilares", v)} />
      </Field>
      <Field label="Formatos">
        <Chips options={FORMATOS} value={value.formatos} onChange={(v) => set("formatos", v)} />
      </Field>
      <Field label="Quantidade de entregáveis por mês">
        <Input type="number" min="0" value={value.qtd_entregaveis} onChange={(e) => set("qtd_entregaveis", Number(e.target.value) || 0)} />
      </Field>
      <Field label="Objetivo principal">
        <Textarea rows={3} value={value.objetivo ?? ""} onChange={(e) => set("objetivo", e.target.value)} />
      </Field>
    </>
  );
}
export const ESTRATEGIA_DEFAULTS: EstrategiaFormValues = {
  cliente_id: "", pilares: [], formatos: [], qtd_entregaveis: 0, objetivo: null,
};
export function validateEstrategia(v: EstrategiaFormValues) {
  const e: Partial<Record<keyof EstrategiaFormValues, string>> = {};
  if (!v.cliente_id) e.cliente_id = "Selecione um cliente";
  return e;
}

/* ================================================================
 * 4. LEAD
 * ================================================================ */
export type LeadFormValues = {
  nome: string;
  valor: number;
  etapa: string;
  origem: string;
  potencial: string;
  email: string | null;
  telefone: string | null;
  proxima_acao: string | null;
  data_proxima_acao: string | null;
  observacoes: string | null;
};
const LEAD_ETAPAS = ["Lead/Entrada", "Reunião Marcada", "Proposta Enviada", "Negociando"];
const LEAD_ORIGENS = ["Instagram", "Google", "Indicação", "LinkedIn", "Outro"];
const LEAD_POTENCIAL = ["Altíssimo", "Alto", "Médio", "Baixo"];

export function LeadForm({ value, onChange, errors }: {
  value: LeadFormValues;
  onChange: (v: LeadFormValues) => void;
  errors: Partial<Record<keyof LeadFormValues, string>>;
}) {
  const set = <K extends keyof LeadFormValues>(k: K, v: LeadFormValues[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <Field label="Nome" required error={errors.nome}>
        <Input value={value.nome} onChange={(e) => set("nome", e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Valor estimado (R$)" required error={errors.valor}>
          <Input type="number" step="0.01" value={value.valor} onChange={(e) => set("valor", Number(e.target.value) || 0)} />
        </Field>
        <Field label="Etapa">
          <Select value={value.etapa} onValueChange={(v) => set("etapa", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_ETAPAS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Origem">
          <Select value={value.origem} onValueChange={(v) => set("origem", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_ORIGENS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Potencial">
          <Select value={value.potencial} onValueChange={(v) => set("potencial", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_POTENCIAL.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="E-mail" error={errors.email}>
          <Input type="email" value={value.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="WhatsApp">
          <Input value={value.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} />
        </Field>
        <Field label="Próxima ação">
          <Input value={value.proxima_acao ?? ""} onChange={(e) => set("proxima_acao", e.target.value)} />
        </Field>
        <Field label="Data próxima ação">
          <Input type="date" value={value.data_proxima_acao ?? ""} onChange={(e) => set("data_proxima_acao", e.target.value || null)} />
        </Field>
      </div>
      <Field label="Anotações">
        <Textarea rows={3} value={value.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} />
      </Field>
    </>
  );
}
export const LEAD_DEFAULTS: LeadFormValues = {
  nome: "", valor: 0, etapa: "Lead/Entrada", origem: "Instagram", potencial: "Alto",
  email: null, telefone: null, proxima_acao: null, data_proxima_acao: null, observacoes: null,
};
export function validateLead(v: LeadFormValues) {
  const e: Partial<Record<keyof LeadFormValues, string>> = {};
  if (!v.nome.trim()) e.nome = "Nome é obrigatório";
  if (!v.valor || v.valor <= 0) e.valor = "Valor deve ser maior que zero";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "E-mail inválido";
  return e;
}

/* ================================================================
 * 5. LANÇAMENTO FINANCEIRO
 * ================================================================ */
export type LancamentoFormValues = {
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  data_vencimento: string;
  status_pagamento: "pago" | "pendente";
  categoria_livre: string;
  cliente_id: string | null;
};
const CATEGORIAS_ENTRADA = ["Cliente Recorrente", "Projeto Avulso", "Consultoria", "Outro"];
const CATEGORIAS_SAIDA = ["Ferramenta", "Tráfego Pago", "Imposto", "Pro-labore", "Outro"];

export function LancamentoForm({ value, onChange, errors }: {
  value: LancamentoFormValues;
  onChange: (v: LancamentoFormValues) => void;
  errors: Partial<Record<keyof LancamentoFormValues, string>>;
}) {
  const clientes = useClientes();
  const set = <K extends keyof LancamentoFormValues>(k: K, v: LancamentoFormValues[K]) => onChange({ ...value, [k]: v });
  const cats = value.tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;
  return (
    <>
      <Field label="Tipo" required>
        <RadioGroup
          value={value.tipo}
          onValueChange={(v) => onChange({ ...value, tipo: v as "entrada" | "saida", categoria_livre: "" })}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 min-h-11 cursor-pointer">
            <RadioGroupItem value="entrada" id="tipo-entrada" />
            <span>Entrada</span>
          </label>
          <label className="flex items-center gap-2 min-h-11 cursor-pointer">
            <RadioGroupItem value="saida" id="tipo-saida" />
            <span>Saída</span>
          </label>
        </RadioGroup>
      </Field>
      <Field label="Descrição" required error={errors.descricao}>
        <Input value={value.descricao} onChange={(e) => set("descricao", e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Valor (R$)" required error={errors.valor}>
          <Input type="number" step="0.01" value={value.valor} onChange={(e) => set("valor", Number(e.target.value) || 0)} />
        </Field>
        <Field label="Data">
          <Input type="date" value={value.data_vencimento} onChange={(e) => set("data_vencimento", e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={value.status_pagamento} onValueChange={(v) => set("status_pagamento", v as "pago" | "pendente")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Categoria">
          <Select value={value.categoria_livre} onValueChange={(v) => set("categoria_livre", v)}>
            <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Cliente vinculado">
        <Select value={value.cliente_id ?? ""} onValueChange={(v) => set("cliente_id", v || null)}>
          <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
          <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
    </>
  );
}
export const LANCAMENTO_DEFAULTS: LancamentoFormValues = {
  tipo: "entrada", descricao: "", valor: 0,
  data_vencimento: new Date().toISOString().slice(0, 10),
  status_pagamento: "pago", categoria_livre: "Cliente Recorrente", cliente_id: null,
};
export function validateLancamento(v: LancamentoFormValues) {
  const e: Partial<Record<keyof LancamentoFormValues, string>> = {};
  if (!v.descricao.trim()) e.descricao = "Descrição é obrigatória";
  if (!v.valor || v.valor <= 0) e.valor = "Valor deve ser maior que zero";
  return e;
}

/* ================================================================
 * 6. REFERÊNCIA
 * ================================================================ */
export type ReferenciaFormValues = {
  titulo: string;
  categoria: string;
  url: string;
  descricao: string | null;
};
const REF_CATS = ["Hooks Virais", "CTAs", "Headlines", "Refs Visuais", "Reels Virais", "Cases Reais", "Frameworks"];

export function ReferenciaForm({ value, onChange, errors }: {
  value: ReferenciaFormValues;
  onChange: (v: ReferenciaFormValues) => void;
  errors: Partial<Record<keyof ReferenciaFormValues, string>>;
}) {
  const set = <K extends keyof ReferenciaFormValues>(k: K, v: ReferenciaFormValues[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <Field label="Título" required error={errors.titulo}>
        <Input value={value.titulo} onChange={(e) => set("titulo", e.target.value)} />
      </Field>
      <Field label="Categoria">
        <Select value={value.categoria} onValueChange={(v) => set("categoria", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{REF_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="URL" required error={errors.url}>
        <Input type="url" value={value.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
      </Field>
      <Field label="Descrição curta">
        <Input value={value.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} />
      </Field>
    </>
  );
}
export const REFERENCIA_DEFAULTS: ReferenciaFormValues = {
  titulo: "", categoria: "Hooks Virais", url: "", descricao: null,
};
export function validateReferencia(v: ReferenciaFormValues) {
  const e: Partial<Record<keyof ReferenciaFormValues, string>> = {};
  if (!v.titulo.trim()) e.titulo = "Título é obrigatório";
  if (!v.url.trim()) e.url = "URL é obrigatória";
  else if (!/^https?:\/\//i.test(v.url)) e.url = "URL deve começar com http:// ou https://";
  return e;
}

/* ================================================================
 * 7. PROMPT
 * ================================================================ */
export type PromptFormValues = {
  titulo: string;
  categoria: string;
  conteudo: string;
};
const PROMPT_CATS = ["Framework Copy", "Prompt IA Legenda", "Prompt IA Reels", "Prompt IA Headline", "Prompt IA Conteúdo", "Midjourney"];

export function PromptForm({ value, onChange, errors }: {
  value: PromptFormValues;
  onChange: (v: PromptFormValues) => void;
  errors: Partial<Record<keyof PromptFormValues, string>>;
}) {
  const set = <K extends keyof PromptFormValues>(k: K, v: PromptFormValues[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <Field label="Título" required error={errors.titulo}>
        <Input value={value.titulo} onChange={(e) => set("titulo", e.target.value)} />
      </Field>
      <Field label="Categoria">
        <Select value={value.categoria} onValueChange={(v) => set("categoria", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{PROMPT_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Conteúdo do prompt" required error={errors.conteudo}>
        <Textarea rows={6} value={value.conteudo} onChange={(e) => set("conteudo", e.target.value)} />
      </Field>
    </>
  );
}
export const PROMPT_DEFAULTS: PromptFormValues = {
  titulo: "", categoria: "Framework Copy", conteudo: "",
};
export function validatePrompt(v: PromptFormValues) {
  const e: Partial<Record<keyof PromptFormValues, string>> = {};
  if (!v.titulo.trim()) e.titulo = "Título é obrigatório";
  if (!v.conteudo.trim()) e.conteudo = "Conteúdo é obrigatório";
  return e;
}

/* ================================================================
 * 8. FERRAMENTA
 * ================================================================ */
export type FerramentaFormValues = {
  nome: string;
  descricao: string | null;
  url: string;
  custo_mensal: number;
  categoria: string;
};
const FER_CATS = ["Agendamento", "Design", "IA", "Edição de Vídeo", "Mídia", "Workspace", "Outro"];

export function FerramentaForm({ value, onChange, errors }: {
  value: FerramentaFormValues;
  onChange: (v: FerramentaFormValues) => void;
  errors: Partial<Record<keyof FerramentaFormValues, string>>;
}) {
  const set = <K extends keyof FerramentaFormValues>(k: K, v: FerramentaFormValues[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <Field label="Nome" required error={errors.nome}>
        <Input value={value.nome} onChange={(e) => set("nome", e.target.value)} />
      </Field>
      <Field label="Descrição">
        <Input value={value.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} />
      </Field>
      <Field label="URL" required error={errors.url}>
        <Input type="url" value={value.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Custo mensal (R$)">
          <Input type="number" min="0" step="0.01" value={value.custo_mensal} onChange={(e) => set("custo_mensal", Number(e.target.value) || 0)} />
        </Field>
        <Field label="Categoria">
          <Select value={value.categoria} onValueChange={(v) => set("categoria", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FER_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
    </>
  );
}
export const FERRAMENTA_DEFAULTS: FerramentaFormValues = {
  nome: "", descricao: null, url: "", custo_mensal: 0, categoria: "Outro",
};
export function validateFerramenta(v: FerramentaFormValues) {
  const e: Partial<Record<keyof FerramentaFormValues, string>> = {};
  if (!v.nome.trim()) e.nome = "Nome é obrigatório";
  if (!v.url.trim()) e.url = "URL é obrigatória";
  else if (!/^https?:\/\//i.test(v.url)) e.url = "URL deve começar com http:// ou https://";
  return e;
}
