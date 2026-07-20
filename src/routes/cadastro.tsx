import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { criarSolicitacao, registrarSolicitacaoPublica } from "@/lib/cadastros.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro de cliente — Irys" },
      { name: "description", content: "Solicite acesso ao portal do cliente Irys." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/login",
          data: { nome },
        },
      });
      if (signUpErr) throw signUpErr;

      // Se e-mail não requer confirmação, já teremos sessão; senão tentamos login para
      // obter sessão e conseguir gravar a solicitação (RLS exige auth.uid()).
      if (!signUp.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          // E-mail requer confirmação — não conseguimos gravar solicitação ainda.
          setEnviado(true);
          setMsg(
            "Verifique seu e-mail para confirmar a conta. Depois faça login e sua solicitação será registrada automaticamente.",
          );
          return;
        }
      }

      await criarSolicitacao({ data: { nome, email } });
      setEnviado(true);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-[#E8D8C0] text-center space-y-3">
          <h1 className="text-2xl font-bold text-[#2C1505]">Cadastro enviado!</h1>
          <p className="text-sm text-[#7A6050]">
            {msg ??
              "Recebemos sua solicitação. Aguarde a aprovação da nossa equipe para acessar seu portal — você será avisado por e-mail."}
          </p>
          <Button
            onClick={() => navigate({ to: "/login" })}
            className="w-full bg-[#2C1505] hover:bg-[#7A4A18] text-white"
          >
            Ir para o login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-[#E8D8C0]">
        <h1 className="text-2xl font-bold text-[#2C1505] mb-1">Solicitar acesso</h1>
        <p className="text-sm text-[#7A6050] mb-6">
          Preencha para pedir acesso ao seu portal do cliente. A liberação é feita manualmente pela
          equipe Irys.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nome completo</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2C1505] hover:bg-[#7A4A18] text-white"
          >
            {loading ? "Enviando..." : "Enviar cadastro"}
          </Button>
        </form>

        {msg && <p className="mt-4 text-sm text-[#7A4A18]">{msg}</p>}

        <p className="mt-6 text-sm text-[#7A4A18] text-center">
          Já tem conta?{" "}
          <Link to="/login" className="underline font-semibold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
