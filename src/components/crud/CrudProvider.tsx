import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CrudSheet } from "./CrudSheet";
import { ConfirmDelete } from "./ConfirmDelete";
import {
  TarefaForm, TAREFA_DEFAULTS, validateTarefa, type TarefaFormValues,
  ClienteForm, CLIENTE_DEFAULTS, validateCliente, type ClienteFormValues,
  EstrategiaForm, ESTRATEGIA_DEFAULTS, validateEstrategia, type EstrategiaFormValues,
  LeadForm, LEAD_DEFAULTS, validateLead, type LeadFormValues,
  LancamentoForm, LANCAMENTO_DEFAULTS, validateLancamento, type LancamentoFormValues,
  ReferenciaForm, REFERENCIA_DEFAULTS, validateReferencia, type ReferenciaFormValues,
  PromptForm, PROMPT_DEFAULTS, validatePrompt, type PromptFormValues,
  FerramentaForm, FERRAMENTA_DEFAULTS, validateFerramenta, type FerramentaFormValues,
} from "./forms";

type Entity =
  | "tarefa" | "cliente" | "estrategia" | "lead"
  | "lancamento" | "referencia" | "prompt" | "ferramenta";

const TABLE_BY_ENTITY: Record<Entity, string> = {
  tarefa: "tarefas",
  cliente: "clientes",
  estrategia: "estrategias",
  lead: "leads",
  lancamento: "financas_administrativas",
  referencia: "referencias",
  prompt: "prompts",
  ferramenta: "ferramentas",
};

const LABEL_BY_ENTITY: Record<Entity, string> = {
  tarefa: "tarefa",
  cliente: "cliente",
  estrategia: "estratégia",
  lead: "lead",
  lancamento: "lançamento",
  referencia: "referência",
  prompt: "prompt",
  ferramenta: "ferramenta",
};

type CrudCtx = {
  openCreate: (entity: Entity, preset?: Record<string, unknown>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openEdit: (entity: Entity, row: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDelete: (entity: Entity, row: any) => void;
};

const Ctx = createContext<CrudCtx | null>(null);
export const useCrud = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCrud must be used within CrudProvider");
  return v;
};

/* ---------- mapping row -> form values ---------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToValues(entity: Entity, row: any): unknown {
  switch (entity) {
    case "tarefa": return {
      titulo: row.titulo ?? "", cliente_id: row.cliente_id, tipo: row.tipo ?? "Outro",
      status: row.status ?? "Backlog", prioridade: row.prioridade ?? "Média",
      prazo: row.prazo, descricao: row.descricao,
    } satisfies TarefaFormValues;
    case "cliente": return {
      nome: row.nome ?? "", plano_label: row.plano_label ?? "Social Media Básico",
      valor_mensal: row.valor_mensal, status_contrato: row.status_contrato ?? "pendente_assinatura",
      email: row.email, telefone: row.telefone,
    } satisfies ClienteFormValues;
    case "estrategia": return {
      cliente_id: row.cliente_id ?? "", pilares: row.pilares ?? [], formatos: row.formatos ?? [],
      qtd_entregaveis: row.qtd_entregaveis ?? 0, objetivo: row.objetivo,
    } satisfies EstrategiaFormValues;
    case "lead": return {
      nome: row.nome ?? "", valor: Number(row.valor) || 0, etapa: row.etapa ?? "Novo Lead",
      origem: row.origem ?? "Instagram", potencial: row.potencial ?? "Alto",
      email: row.email, telefone: row.telefone, proxima_acao: row.proxima_acao,
      data_proxima_acao: row.data_proxima_acao, ultimo_contato: row.ultimo_contato ?? null, observacoes: row.observacoes,
    } satisfies LeadFormValues;
    case "lancamento": return {
      tipo: row.tipo ?? "entrada", descricao: row.descricao ?? "",
      valor: Number(row.valor) || 0,
      data_vencimento: row.data_vencimento ?? new Date().toISOString().slice(0, 10),
      status_pagamento: row.status_pagamento ?? "pago",
      categoria_livre: row.categoria_livre ?? "",
      cliente_id: row.cliente_id,
    } satisfies LancamentoFormValues;
    case "referencia": return {
      titulo: row.titulo ?? "", categoria: row.categoria ?? "Hooks Virais",
      url: row.url ?? "", descricao: row.descricao,
    } satisfies ReferenciaFormValues;
    case "prompt": return {
      titulo: row.titulo ?? "", categoria: row.categoria ?? "Framework Copy",
      conteudo: row.conteudo ?? "",
    } satisfies PromptFormValues;
    case "ferramenta": return {
      nome: row.nome ?? "", descricao: row.descricao, url: row.url ?? "",
      custo_mensal: Number(row.custo_mensal) || 0, categoria: row.categoria ?? "Outro",
    } satisfies FerramentaFormValues;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function valuesToPayload(entity: Entity, values: any) {
  // Direct pass-through — form field names already match DB columns.
  // For lancamento, need to strip empty categoria_livre etc.
  const payload = { ...values };
  if (entity === "lancamento") {
    // financas_administrativas requires a `categoria` enum; set to 'outro' by default
    // and rely on categoria_livre for the display value.
    payload.categoria = "outro";
  }
  return payload;
}

const DEFAULTS_BY_ENTITY: Record<Entity, unknown> = {
  tarefa: TAREFA_DEFAULTS,
  cliente: CLIENTE_DEFAULTS,
  estrategia: ESTRATEGIA_DEFAULTS,
  lead: LEAD_DEFAULTS,
  lancamento: LANCAMENTO_DEFAULTS,
  referencia: REFERENCIA_DEFAULTS,
  prompt: PROMPT_DEFAULTS,
  ferramenta: FERRAMENTA_DEFAULTS,
};

const TITLES: Record<Entity, { create: string; edit: string }> = {
  tarefa: { create: "Nova tarefa", edit: "Editar tarefa" },
  cliente: { create: "Novo cliente", edit: "Editar cliente" },
  estrategia: { create: "Nova estratégia", edit: "Editar estratégia" },
  lead: { create: "Novo lead", edit: "Editar lead" },
  lancamento: { create: "Novo lançamento", edit: "Editar lançamento" },
  referencia: { create: "Adicionar referência", edit: "Editar referência" },
  prompt: { create: "Novo prompt", edit: "Editar prompt" },
  ferramenta: { create: "Adicionar ferramenta", edit: "Editar ferramenta" },
};

const SUBMIT_LABELS: Record<Entity, string> = {
  tarefa: "Criar tarefa",
  cliente: "Salvar cliente",
  estrategia: "Criar estratégia",
  lead: "Adicionar lead",
  lancamento: "Registrar lançamento",
  referencia: "Adicionar referência",
  prompt: "Salvar prompt",
  ferramenta: "Adicionar",
};

export function CrudProvider({ children }: { children: ReactNode }) {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [values, setValues] = useState<unknown>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errors, setErrors] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const [delEntity, setDelEntity] = useState<Entity | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  const openCreate = useCallback((e: Entity, preset?: Record<string, unknown>) => {
    setEntity(e);
    setEditId(null);
    const defaults = DEFAULTS_BY_ENTITY[e] as Record<string, unknown>;
    setValues({ ...defaults, ...(preset ?? {}) });
    setErrors({});
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = useCallback((e: Entity, row: any) => {
    setEntity(e);
    setEditId(row.id);
    setValues(rowToValues(e, row));
    setErrors({});
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openDelete = useCallback((e: Entity, row: any) => {
    setDelEntity(e);
    setDelId(row.id);
  }, []);

  const close = useCallback(() => {
    setEntity(null);
    setEditId(null);
    setValues(null);
    setErrors({});
  }, []);

  const validate = (e: Entity, v: unknown) => {
    switch (e) {
      case "tarefa": return validateTarefa(v as TarefaFormValues);
      case "cliente": return validateCliente(v as ClienteFormValues);
      case "estrategia": return validateEstrategia(v as EstrategiaFormValues);
      case "lead": return validateLead(v as LeadFormValues);
      case "lancamento": return validateLancamento(v as LancamentoFormValues);
      case "referencia": return validateReferencia(v as ReferenciaFormValues);
      case "prompt": return validatePrompt(v as PromptFormValues);
      case "ferramenta": return validateFerramenta(v as FerramentaFormValues);
    }
  };

  const submit = useCallback(async () => {
    if (!entity || !values) return;
    const errs = validate(entity, values);
    if (errs && Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    const table = TABLE_BY_ENTITY[entity];
    const payload = valuesToPayload(entity, values);
    try {
      if (editId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from(table as any) as any).update(payload).eq("id", editId);
        if (error) throw error;
        toast.success(`${LABEL_BY_ENTITY[entity][0].toUpperCase()}${LABEL_BY_ENTITY[entity].slice(1)} atualizada com sucesso`);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from(table as any) as any).insert(payload);
        if (error) throw error;
        toast.success("Salvo com sucesso");
      }
      close();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.message ?? "Erro ao salvar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [entity, values, editId, close]);

  const confirmDelete = useCallback(async () => {
    if (!delEntity || !delId) return;
    const table = TABLE_BY_ENTITY[delEntity];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table as any) as any).delete().eq("id", delId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Excluído com sucesso");
    }
    setDelEntity(null);
    setDelId(null);
  }, [delEntity, delId]);

  const ctx = useMemo(() => ({ openCreate, openEdit, openDelete }), [openCreate, openEdit, openDelete]);

  const renderForm = () => {
    if (!entity || !values) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const common = { value: values as any, onChange: setValues, errors };
    switch (entity) {
      case "tarefa":    return <TarefaForm    {...common} />;
      case "cliente":   return <ClienteForm   {...common} />;
      case "estrategia":return <EstrategiaForm {...common} />;
      case "lead":      return <LeadForm      {...common} />;
      case "lancamento":return <LancamentoForm {...common} />;
      case "referencia":return <ReferenciaForm {...common} />;
      case "prompt":    return <PromptForm    {...common} />;
      case "ferramenta":return <FerramentaForm {...common} />;
    }
  };

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <CrudSheet
        open={!!entity}
        onOpenChange={(v) => !v && close()}
        title={entity ? TITLES[entity][editId ? "edit" : "create"] : ""}
        submitLabel={entity ? SUBMIT_LABELS[entity] : "Salvar"}
        saving={saving}
        onSubmit={submit}
      >
        {renderForm()}
      </CrudSheet>
      <ConfirmDelete
        open={!!delEntity && !!delId}
        onOpenChange={(v) => { if (!v) { setDelEntity(null); setDelId(null); } }}
        onConfirm={confirmDelete}
      />
    </Ctx.Provider>
  );
}
