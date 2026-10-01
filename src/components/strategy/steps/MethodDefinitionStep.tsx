import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { StepProps } from "../StrategyWorkspace";
import { inputCls } from "../ui";
import { useAutosave, useStrategyActions } from "../useStrategy";

type Field = { key: string; label: string; hint?: string; rows?: number };
type Phase = { title: string; description: string; fields: Field[] };

const METHOD: Record<number, { intro: string; phases: Phase[] }> = {
  8: { intro: "Transforme o gargalo aprovado em uma mudança estratégica mensurável — sem confundir objetivo com tarefa.", phases: [
    { title: "Problema → objetivo", description: "Parta do gargalo e formule a transformação necessária.", fields: [
      { key: "problema_estrategico", label: "Problema estratégico", hint: "Qual problema central o gargalo revela?" },
      { key: "estado_atual", label: "Estado atual", hint: "O que acontece hoje?" },
      { key: "transformacao_dominante", label: "Transformação dominante", hint: "O que precisa mudar de forma prioritária?" },
      { key: "estado_desejado", label: "Estado desejado", hint: "Como deve ser a situação após a mudança?" },
    ]},
    { title: "Formulação e auditoria", description: "Converta a transformação em objetivo e verifique se ele responde ao gargalo.", fields: [
      { key: "objetivo", label: "Objetivo estratégico", hint: "Resultado estratégico, não lista de ações.", rows: 3 },
      { key: "mudanca", label: "Mudança desejada", hint: "De onde → para onde?" },
      { key: "indicadores", label: "Indicadores / sinais de avanço" },
      { key: "prazo", label: "Horizonte / prazo" },
      { key: "criterio", label: "Critério de sucesso" },
      { key: "auditoria_objetivo", label: "Auditoria do objetivo", hint: "Por que este objetivo resolve o gargalo? O que ele não tenta resolver?" },
    ]},
  ]},
  9: { intro: "Escolha o grupo em que a transformação estratégica tem maior potencial. Público prioritário não é sinônimo de público-alvo amplo.", phases: [
    { title: "Segmentos candidatos", description: "Liste de 3 a 6 segmentos plausíveis antes de escolher.", fields: [
      { key: "segmentos", label: "Segmentos candidatos", hint: "Um por linha, com contexto/situação quando possível.", rows: 5 },
      { key: "criterios_priorizacao", label: "Critérios de priorização", hint: "Potencial, aderência ao objetivo, urgência, capacidade de decisão, acesso etc." },
      { key: "publico_prioritario", label: "Público prioritário escolhido", rows: 3 },
      { key: "justificativa_publico", label: "Por que este público é prioritário?" },
    ]},
    { title: "Jornada e decisão", description: "Entenda a situação concreta e como esse público decide hoje.", fields: [
      { key: "situacao", label: "Situação / momento vivido" },
      { key: "jornada", label: "Momento da jornada" },
      { key: "tensao", label: "Tensão central" },
      { key: "decisao_atual", label: "Como decide hoje?" },
      { key: "decisao_desejada", label: "Como precisa passar a decidir?" },
      { key: "dores", label: "Dores relevantes" },
      { key: "desejos", label: "Desejos relevantes" },
      { key: "objecoes", label: "Objeções" },
      { key: "linguagem_publico", label: "Linguagem real do público", hint: "Palavras e expressões observadas na pesquisa." },
    ]},
  ]},
  10: { intro: "Defina a mudança de percepção que a marca precisa provocar e sustente a posição com diferenciais e provas reais.", phases: [
    { title: "Percepção atual → desejada", description: "Mapeie o que o público pensa hoje e o que precisa passar a pensar.", fields: [
      { key: "percepcao_atual", label: "Percepção atual", hint: "Associações, critérios, autoridade percebida, risco e diferenciação." },
      { key: "percepcao_desejada", label: "Percepção desejada" },
      { key: "mudanca_percepcao", label: "Mudança de percepção", hint: "Hoje pensa → queremos que passe a pensar." },
    ]},
    { title: "Concorrência mental", description: "Mapeie forças que disputam a decisão — não apenas empresas.", fields: [
      { key: "concorrentes_diretos", label: "Concorrentes diretos" },
      { key: "crencas_existentes", label: "Crenças existentes" },
      { key: "criterios_antigos", label: "Critérios antigos de escolha" },
      { key: "medos", label: "Medos" },
      { key: "alternativas", label: "Alternativas" },
      { key: "inercia", label: "Inércia / não fazer nada" },
      { key: "territorios_candidatos", label: "Territórios candidatos" },
    ]},
    { title: "Diferenciação, provas e posicionamento", description: "Um diferencial precisa ser verdadeiro, relevante, sustentável e demonstrável.", fields: [
      { key: "diferenciacao", label: "Diferenciais competitivos" },
      { key: "atributos_provas", label: "Atributos → comportamentos → provas" },
      { key: "lacunas_prova", label: "Lacunas de prova" },
      { key: "razoes", label: "Razões para acreditar" },
      { key: "territorio", label: "Território mental estratégico" },
      { key: "posicionamento_final", label: "Posicionamento aprovado", rows: 4 },
      { key: "promessa", label: "Promessa / proposta central" },
      { key: "limites_posicionamento", label: "Limites e promessas que não devemos fazer" },
    ]},
  ]},
  11: { intro: "Construa a lógica que muda crenças: tese → argumentos → provas → mensagens → jornada. Não comece pelo formato do post.", phases: [
    { title: "Crenças e tese estratégica", description: "Defina a crença que sustenta o comportamento atual e a crença que a estratégia precisa construir.", fields: [
      { key: "crenca_atual", label: "Crença central atual" },
      { key: "crenca_desejada", label: "Crença desejada" },
      { key: "tese_estrategica", label: "Tese estratégica", rows: 4 },
    ]},
    { title: "Arquitetura argumentativa e provas", description: "Argumentos sustentam a tese; provas sustentam os argumentos.", fields: [
      { key: "argumentos", label: "Argumentos principais", hint: "Liste e explique os argumentos que sustentam a tese.", rows: 5 },
      { key: "subargumentos", label: "Subargumentos" },
      { key: "matriz_provas", label: "Matriz de provas", hint: "Argumento → prova principal → provas de apoio → lacunas.", rows: 5 },
      { key: "lacunas_argumentativas", label: "Lacunas argumentativas / de prova" },
    ]},
    { title: "Objeções e biblioteca de mensagens", description: "Transforme a argumentação em mensagens reutilizáveis, sem perder a prova.", fields: [
      { key: "mapa_objecoes", label: "Mapa de objeções", hint: "Objeção → crença por trás → resposta estratégica → prova.", rows: 5 },
      { key: "mensagem_central", label: "Mensagem central" },
      { key: "mensagens_prioritarias", label: "Mensagens prioritárias" },
      { key: "mensagens_apoio", label: "Mensagens de apoio" },
      { key: "mensagens_prova", label: "Mensagens de prova" },
      { key: "mensagens_acao", label: "Mensagens de ação" },
      { key: "mensagens_proibidas", label: "Mensagens proibidas" },
    ]},
    { title: "Jornada, linguagem e narrativa", description: "Defina como a mensagem muda conforme o momento de decisão.", fields: [
      { key: "mensagem_jornada", label: "Matriz Mensagem × Jornada", hint: "Descoberta, Exploração, Comparação, Decisão, Experiência e Continuidade." },
      { key: "linguagem", label: "Linguagem estratégica", hint: "O público diz → a marca traduz como." },
      { key: "tom_situacao", label: "Tom por situação" },
      { key: "cta_jornada", label: "CTA por etapa da jornada" },
      { key: "narrativa_final", label: "Canvas final da narrativa", rows: 5 },
      { key: "limites", label: "Limites de comunicação" },
    ]},
  ]},
};

export function MethodDefinitionStep({ etapa, data, clienteId, touch }: StepProps & { etapa: number }) {
  const cfg = METHOD[etapa];
  const a = useStrategyActions(clienteId);
  const [phase, setPhase] = useState(0);
  if (!cfg) return null;
  const value = (key: string) => data.definicoes.find((d) => d.etapa === etapa && d.campo === key)?.valor ?? (etapa === 8 && key === "objetivo" ? data.legado?.objetivo ?? "" : "");
  const current = cfg.phases[phase];
  const filled = current.fields.filter((f) => value(f.key).trim()).length;

  return <div className="max-w-5xl space-y-6">
    <div className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">{cfg.intro}</div>
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="flex min-w-max gap-1 border-b border-border">
        {cfg.phases.map((p, i) => <button key={p.title} onClick={() => setPhase(i)} className={`-mb-px border-b-2 px-3 py-2 text-[13px] ${phase === i ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          {i + 1}. {p.title}
        </button>)}
      </div>
    </div>
    <section>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div><h3 className="text-base font-semibold text-foreground">{current.title}</h3><p className="mt-0.5 text-[13px] text-muted-foreground">{current.description}</p></div>
        <span className="shrink-0 text-xs text-muted-foreground">{filled}/{current.fields.length} preenchidos</span>
      </div>
      <div className="divide-y divide-border border-y border-border">
        {current.fields.map((f) => <MethodField key={`${etapa}-${f.key}`} field={f} initial={value(f.key)} onSave={async(v) => { await a.saveDefinicao(etapa, f.key, v); touch(); }} />)}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{filled === current.fields.length && <span className="inline-flex items-center gap-1"><CheckCircle2 size={13}/> Subetapa preenchida</span>}</div>
        <div className="flex gap-2">
          {phase > 0 && <button className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px]" onClick={() => setPhase(phase - 1)}>Anterior</button>}
          {phase < cfg.phases.length - 1 && <button className="rounded-md bg-primary px-3 py-1.5 text-[13px] text-primary-foreground" onClick={() => setPhase(phase + 1)}>Próxima subetapa</button>}
        </div>
      </div>
    </section>
  </div>;
}

function MethodField({ field, initial, onSave }: { field: Field; initial: string; onSave: (v: string) => Promise<void> }) {
  const [v, setV] = useState(initial);
  const state = useAutosave(v, onSave);
  return <label className="block py-4">
    <div className="flex items-baseline justify-between gap-3"><span className="text-[13px] font-medium text-foreground">{field.label}</span><span className="text-[11px] text-muted-foreground">{state === "saving" ? "Salvando…" : state === "saved" ? "Salvo" : state === "error" ? "Erro ao salvar" : ""}</span></div>
    {field.hint && <div className="mt-0.5 text-xs text-muted-foreground">{field.hint}</div>}
    <textarea rows={field.rows ?? 3} value={v} onChange={(e) => setV(e.target.value)} className={`${inputCls} mt-2 resize-y leading-relaxed`} />
  </label>;
}
