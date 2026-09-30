import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Não autenticado" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return json({ error: "OPENAI_API_KEY não configurada" }, 503);
    const sb = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: userError } = await sb.auth.getUser();
    if (userError || !userData.user) return json({ error: "Sessão inválida" }, 401);

    const { clienteId, etapa, action, question } = await req.json();
    if (!clienteId) return json({ error: "clienteId obrigatório" }, 400);

    // Every query runs with the caller JWT. Existing RLS is the authorization boundary.
    const q = (table: string, select = "*") => sb.from(table).select(select).eq("cliente_id", clienteId);
    const results = await Promise.all([
      sb.from("clientes").select("id,nome").eq("id", clienteId).single(),
      sb.from("estrategia_briefing").select("mapa,lacunas").eq("cliente_id", clienteId).maybeSingle(),
      q("estrategia_fontes", "id,etapa,nome,tipo,url,status,data_ref,observacoes"),
      q("estrategia_evidencias", "id,etapa,fonte_id,informacao,classificacao,categoria,origem,data_ref,observacao,muda,evidencia,validar"),
      q("estrategia_concorrentes"),
      q("estrategia_achados", "id,etapa,tipo,titulo,descricao,status,origem,deriva_de"),
      q("estrategia_achado_evidencias", "achado_id,evidencia_id"),
      q("estrategia_definicoes", "etapa,campo,valor"),
      q("editorial_pilares", "id,nome,descricao,ordem"),
      q("editorial_temas", "id,pilar_id,nome,descricao"),
      q("editorial_mensagens", "id,tema_id,mensagem,jornada,objetivo_psicologico,cta,formatos"),
      q("editorial_argumentos", "id,mensagem_id,argumento,prova,evidencia_id"),
      q("calendario_estrategico_itens", "data,titulo,canal,formato,pilar_id,tema_id,mensagem_id,jornada,objetivo,cta"),
    ]);
    const denied = results.find(r => r.error);
    if (denied) return json({ error: "Cliente não autorizado ou contexto indisponível" }, 403);
    const [client, briefing, fontes, evidencias, concorrentes, achados, links, definicoes, pilares, temas, mensagens, argumentos, calendario] = results.map(r => r.data);

    const context = { cliente: client, briefing, fontes, evidencias, concorrentes, achados, links, definicoes, editorial: { pilares, temas, mensagens, argumentos }, calendario };
    const requestText = question || action || "Analise a estratégia atual";
    const system = `Você é o Copiloto Estratégico do IRYS. Trabalhe EXCLUSIVAMENTE com o contexto JSON fornecido do cliente atual.\nRegras:\n- Evidência é dado registrado; interpretação da IA nunca vira evidência.\n- Não invente fatos, métricas, fontes ou causas. Quando faltar base, diga claramente que há uma lacuna.\n- Separe observação, interpretação, hipótese e recomendação.\n- Questione conclusões fracas e procure evidências contrárias.\n- Preserve a lógica: investigação → evidências → padrões/contradições → hipóteses → diagnóstico → gargalo → decisão → estratégia → editorial.\n- Seja conciso, específico e cite IDs ou títulos das evidências relevantes quando existirem.\n- Nunca revele raciocínio interno; entregue apenas conclusões e justificativas verificáveis.\nEtapa atual: ${etapa ?? "visão geral"}.`;

    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: Deno.env.get("AI_MODEL") || "gpt-4.1-mini", temperature: 0.2, messages: [
        { role: "system", content: system },
        { role: "user", content: `PEDIDO:\n${requestText}\n\nCONTEXTO AUTORIZADO DO CLIENTE:\n${JSON.stringify(context)}` },
      ] }),
    });
    if (!ai.ok) { const detail = await ai.text(); console.error("AI provider", ai.status, detail.slice(0,500)); return json({ error: "Falha no provedor de IA" }, 502); }
    const payload = await ai.json();
    const answer = payload?.choices?.[0]?.message?.content?.trim();
    if (!answer) return json({ error: "Resposta vazia da IA" }, 502);

    // Log metadata only; do not persist prompt/context/answer.
    await sb.from("estrategia_ai_logs").insert({ cliente_id: clienteId, user_id: userData.user.id, acao: action || "chat", modelo: payload.model ?? Deno.env.get("AI_MODEL") ?? "", tokens_entrada: payload.usage?.prompt_tokens ?? null, tokens_saida: payload.usage?.completion_tokens ?? null, sucesso: true });
    return json({ answer, model: payload.model, usage: payload.usage ?? null });
  } catch (e) {
    console.error(e);
    return json({ error: "Erro inesperado no Copiloto" }, 500);
  }
});
