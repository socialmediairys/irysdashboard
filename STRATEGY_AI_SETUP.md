# IRYS — Copiloto de Estratégia

O código inclui um Copiloto contextual em `supabase/functions/strategy-ai`.

## O que já está pronto no código

- contexto isolado por cliente usando o JWT do usuário e as RLS existentes;
- leitura de briefing, fontes, evidências, concorrentes, achados, vínculos, definições, sistema editorial e calendário;
- ações rápidas por etapa e pergunta livre;
- distinção explícita entre evidência e interpretação da IA;
- logs somente de metadados de uso (sem salvar prompt/contexto/resposta);
- exportação da estratégia aceita/salva para PDF.

## Ativação no Supabase

1. Aplicar a migration `20260930220000_strategy_ai_logs.sql`.
2. Configurar o secret `OPENAI_API_KEY` no projeto Supabase.
3. Opcional: configurar `AI_MODEL`; sem ele a função usa `gpt-4.1-mini`.
4. Publicar a Edge Function `strategy-ai`.

Exemplo via Supabase CLI:

```bash
supabase db push
supabase secrets set OPENAI_API_KEY=SEU_SEGREDO
supabase secrets set AI_MODEL=gpt-4.1-mini
supabase functions deploy strategy-ai
```

Não coloque a chave em `.env` do frontend nem em variáveis `VITE_*`.

## Limite deliberado desta versão

O Copiloto analisa e conversa com contexto real, mas não grava automaticamente diagnóstico, evidências ou definições estratégicas. Isso preserva a regra “IA sugere; humano decide”. A tabela existente de sugestões continua disponível para fluxos estruturados futuros.
