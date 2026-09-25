import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AchadoTipo, BriefingMapa, EtapaRow, EtapaStatus } from "@/lib/strategy";

// Generic table access (tables are new; keep the client loosely typed here).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = (t: string) => (supabase as any).from(t);

export type Fonte = { id: string; etapa: number; nome: string; tipo: string; url: string | null; status: string; data_ref: string | null; observacoes: string | null; created_at: string };
export type Evidencia = { id: string; etapa: number | null; fonte_id: string | null; informacao: string; classificacao: string; categoria: string | null; origem: string | null; data_ref: string | null; observacao: string | null; muda: string | null; evidencia: string | null; validar: string | null; created_at: string };
export type Concorrente = { id: string; nome: string } & Record<string, string | null>;
export type Achado = { id: string; etapa: number; tipo: AchadoTipo; titulo: string; descricao: string | null; status: string; origem: "humano" | "ia"; deriva_de: string | null; updated_at: string };
export type Pilar = { id: string; nome: string; descricao: string | null; ordem: number };
export type Tema = { id: string; pilar_id: string; nome: string; descricao: string | null };
export type Mensagem = { id: string; tema_id: string; mensagem: string; jornada: string | null; objetivo_psicologico: string | null; cta: string | null; formatos: string[] };
export type Argumento = { id: string; mensagem_id: string; argumento: string; prova: string | null; evidencia_id: string | null };
export type CalItem = { id: string; data: string; titulo: string | null; canal: string | null; formato: string | null; pilar_id: string | null; tema_id: string | null; mensagem_id: string | null; argumento_id: string | null; jornada: string | null; objetivo: string | null; cta: string | null };
export type Sugestao = { id: string; etapa: number | null; tipo: string; conteudo: string; status: string };

export type StrategyData = {
  etapas: EtapaRow[];
  briefing: { mapa: BriefingMapa; lacunas: string | null; updated_at: string } | null;
  fontes: Fonte[];
  evidencias: Evidencia[];
  concorrentes: Concorrente[];
  achados: Achado[];
  links: { achado_id: string; evidencia_id: string }[];
  definicoes: { etapa: number; campo: string; valor: string | null; updated_at: string }[];
  pilares: Pilar[]; temas: Tema[]; mensagens: Mensagem[]; argumentos: Argumento[];
  calendario: CalItem[];
  sugestoes: Sugestao[];
  legado: { pilares: unknown; formatos: unknown; objetivo: string | null } | null;
};

async function load(clienteId: string): Promise<StrategyData> {
  const q = (t: string, sel = "*") => db(t).select(sel).eq("cliente_id", clienteId);
  const r = await Promise.all([
    q("estrategia_etapas", "etapa,status,iniciado_em,concluido_em,updated_at"),
    db("estrategia_briefing").select("mapa,lacunas,updated_at").eq("cliente_id", clienteId).maybeSingle(),
    q("estrategia_fontes").order("created_at", { ascending: false }),
    q("estrategia_evidencias").order("created_at", { ascending: false }),
    q("estrategia_concorrentes").order("created_at"),
    q("estrategia_achados").order("created_at"),
    q("estrategia_achado_evidencias", "achado_id,evidencia_id"),
    q("estrategia_definicoes", "etapa,campo,valor,updated_at"),
    q("editorial_pilares").order("ordem"),
    q("editorial_temas").order("created_at"),
    q("editorial_mensagens").order("created_at"),
    q("editorial_argumentos").order("created_at"),
    q("calendario_estrategico_itens").order("data"),
    q("estrategia_sugestoes_ia").eq("status", "pendente"),
    db("estrategias").select("pilares,formatos,objetivo").eq("cliente_id", clienteId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const err = r.find((x: { error: unknown }) => x.error);
  if (err) throw err.error;
  const [et, br, fo, ev, co, ac, li, de, pi, te, me, ar, ca, su, le] = r.map((x: { data: unknown }) => x.data);
  return {
    etapas: (et ?? []) as EtapaRow[],
    briefing: br ? { ...(br as { lacunas: string | null; updated_at: string }), mapa: ((br as { mapa: BriefingMapa }).mapa ?? {}) } : null,
    fontes: (fo ?? []) as Fonte[], evidencias: (ev ?? []) as Evidencia[], concorrentes: (co ?? []) as Concorrente[],
    achados: (ac ?? []) as Achado[], links: (li ?? []) as StrategyData["links"], definicoes: (de ?? []) as StrategyData["definicoes"],
    pilares: (pi ?? []) as Pilar[], temas: (te ?? []) as Tema[], mensagens: (me ?? []) as Mensagem[], argumentos: (ar ?? []) as Argumento[],
    calendario: (ca ?? []) as CalItem[], sugestoes: (su ?? []) as Sugestao[], legado: (le ?? null) as StrategyData["legado"],
  };
}

export const strategyKey = (id: string) => ["strategy", id] as const;

export function useStrategy(clienteId: string) {
  return useQuery({ queryKey: strategyKey(clienteId), queryFn: () => load(clienteId), staleTime: 10_000 });
}

/** Mutations that keep the cache fresh and never fail silently. */
export function useStrategyActions(clienteId: string) {
  const qc = useQueryClient();
  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: strategyKey(clienteId) });
    void qc.invalidateQueries({ queryKey: ["client-workspace", clienteId] });
    void qc.invalidateQueries({ queryKey: ["strategy-global"] });
  }, [qc, clienteId]);

  const run = useCallback(async (p: PromiseLike<{ error: { message: string } | null }>, silent = false) => {
    const { error } = await p;
    if (error) { toast.error("Não foi possível salvar. Tente novamente."); console.error(error); throw error; }
    if (!silent) refresh(); else refresh();
  }, [refresh]);

  const touchStep = useCallback(async (etapa: number, current?: EtapaStatus) => {
    if (current && current !== "nao_iniciada") return;
    await run(db("estrategia_etapas").upsert(
      { cliente_id: clienteId, etapa, status: "em_andamento", iniciado_em: new Date().toISOString() },
      { onConflict: "cliente_id,etapa" },
    ), true);
  }, [clienteId, run]);

  const setStatus = useCallback(async (etapa: number, status: EtapaStatus) => {
    const now = new Date().toISOString();
    await run(db("estrategia_etapas").upsert({
      cliente_id: clienteId, etapa, status,
      concluido_em: status === "concluida" ? now : null,
      ...(status !== "nao_iniciada" ? { iniciado_em: now } : {}),
    }, { onConflict: "cliente_id,etapa" }));
  }, [clienteId, run]);

  return {
    refresh, run, touchStep, setStatus,
    insert: (t: string, row: Record<string, unknown>) => run(db(t).insert({ cliente_id: clienteId, ...row })),
    update: (t: string, id: string, patch: Record<string, unknown>) => run(db(t).update(patch).eq("id", id), true),
    remove: (t: string, id: string) => run(db(t).delete().eq("id", id)),
    link: (achado_id: string, evidencia_id: string, on: boolean) => run(on
      ? db("estrategia_achado_evidencias").insert({ achado_id, evidencia_id, cliente_id: clienteId })
      : db("estrategia_achado_evidencias").delete().eq("achado_id", achado_id).eq("evidencia_id", evidencia_id)),
    saveDefinicao: (etapa: number, campo: string, valor: string) => run(db("estrategia_definicoes").upsert(
      { cliente_id: clienteId, etapa, campo, valor }, { onConflict: "cliente_id,etapa,campo" }), true),
    saveBriefing: (mapa: BriefingMapa, scores: Record<string, number>) => run(db("estrategia_briefing").upsert(
      { cliente_id: clienteId, mapa, scores, updated_at: new Date().toISOString() }, { onConflict: "cliente_id" }), true),
  };
}

/** Debounced autosave with discreet state: idle → saving → saved | error. Flushes on unmount. */
export function useAutosave<T>(value: T, save: (v: T) => Promise<void>, delay = 800) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const first = useRef(true);
  const pending = useRef<T | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    pending.current = value;
    const t = setTimeout(async () => {
      pending.current = null;
      setState("saving");
      try { await saveRef.current(value); setState("saved"); } catch { setState("error"); }
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  useEffect(() => () => { if (pending.current !== null) void saveRef.current(pending.current).catch(() => {}); }, []);
  return state;
}
