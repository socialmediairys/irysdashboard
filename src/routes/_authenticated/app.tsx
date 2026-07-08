import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { meuStatusCadastro, criarSolicitacao } from "@/lib/cadastros.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppDispatch,
});

function AppDispatch() {
  const navigate = useNavigate();
  const status = useServerFn(meuStatusCadastro);
  const criar = useServerFn(criarSolicitacao);
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "pendente" }
    | { kind: "rejeitado"; obs: string | null }
    | { kind: "sem_cadastro" }
    | { kind: "erro"; msg: string }
  >({ kind: "loading" });

  useEffect(() => {
    (async () => {
      try {
        const r = await status();
        if (r.tipo === "admin") {
          navigate({ to: "/admin/visao-geral" });
          return;
        }
        if (r.tipo === "cliente_ativo") {
          navigate({ to: "/meu-portal" });
          return;
        }
        if (r.tipo === "pendente") {
          setState({ kind: "pendente" });
          return;
        }
        if (r.tipo === "rejeitado") {
          setState({ kind: "rejeitado", obs: r.observacao });
          return;
        }
        setState({ kind: "sem_cadastro" });
      } catch (e) {
        setState({ kind: "erro", msg: e instanceof Error ? e.message : "Erro" });
      }
    })();
  }, [navigate, status]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const criarPendente = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return navigate({ to: "/login" });
    await criar({
      data: {
        nome: (u.user.user_metadata?.nome as string) ?? u.user.email ?? "Cliente",
        email: u.user.email ?? "",
      },
    });
    setState({ kind: "pendente" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-[#E8D8C0] text-center space-y-3">
        {state.kind === "loading" && <p className="text-[#7A4A18]">Carregando...</p>}
        {state.kind === "pendente" && (
          <>
            <h1 className="text-xl font-bold text-[#2C1505]">Seu cadastro está em análise</h1>
            <p className="text-sm text-[#7A6050]">
              Assim que a equipe Irys aprovar seu acesso, você será liberado para ver seu portal.
            </p>
          </>
        )}
        {state.kind === "rejeitado" && (
          <>
            <h1 className="text-xl font-bold text-[#2C1505]">Cadastro não aprovado</h1>
            <p className="text-sm text-[#7A6050]">
              Sua solicitação foi rejeitada. Entre em contato com a equipe Irys para mais informações.
            </p>
            {state.obs && (
              <p className="text-xs text-[#7A6050] italic">Observação: {state.obs}</p>
            )}
          </>
        )}
        {state.kind === "sem_cadastro" && (
          <>
            <h1 className="text-xl font-bold text-[#2C1505]">Solicite seu acesso</h1>
            <p className="text-sm text-[#7A6050]">
              Você está logado, mas ainda não há uma solicitação de acesso registrada.
            </p>
            <Button onClick={criarPendente} className="w-full bg-[#2C1505] hover:bg-[#7A4A18] text-white">
              Registrar solicitação agora
            </Button>
          </>
        )}
        {state.kind === "erro" && (
          <p className="text-sm text-[#7A4A18]">Erro: {state.msg}</p>
        )}
        <Button onClick={signOut} variant="outline" className="w-full">
          Sair
        </Button>
      </div>
    </div>
  );
}
