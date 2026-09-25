import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { criarSolicitacao } from "@/lib/cadastros.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Portal do cliente Irys" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Garante que exista uma solicitação, caso o usuário tenha se cadastrado
      // com confirmação de e-mail ativa (não foi possível gravá-la antes).
      try {
        await criarSolicitacao({
          data: {
            nome: (data.user?.user_metadata?.nome as string) ?? email,
            email,
          },
        });
      } catch {
        // Se já existe uma solicitação/aprovação, seguimos normalmente.
      }

      navigate({ to: "/app" });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <BrandLogo className="mb-6 h-8" />
        <h1 className="text-2xl font-bold text-foreground mb-1">Portal do cliente</h1>
        <p className="text-sm text-muted-foreground mb-6">Entre com seu e-mail e senha.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
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
            className="w-full"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        {msg && <p className="mt-4 text-sm text-primary">{msg}</p>}

        <p className="mt-6 text-sm text-primary text-center">
          Não tem conta?{" "}
          <Link to="/cadastro" className="underline font-semibold">
            Solicitar acesso
          </Link>
        </p>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Administradores da equipe:{" "}
          <Link to="/auth" className="underline">
            entrar por aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
