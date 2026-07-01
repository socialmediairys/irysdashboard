import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Entrar — Painel 360°" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome },
          },
        });
        if (error) throw error;
        setMsg("Conta criada! Verifique seu e-mail se a confirmação estiver ativa.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app" });
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) setMsg(result.error.message);
    else if (!result.redirected) navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-[#E8D8C0]">
        <h1 className="text-2xl font-bold text-[#2C1505] mb-1">Painel 360°</h1>
        <p className="text-sm text-[#7A6050] mb-6">
          {mode === "login" ? "Entre para acessar seu painel" : "Crie sua conta"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
          )}
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
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-2 text-xs text-[#BBA898]">
          <div className="h-px flex-1 bg-[#E8D8C0]" />
          <span>ou</span>
          <div className="h-px flex-1 bg-[#E8D8C0]" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogle}
          className="w-full border-[#E8D8C0]"
        >
          Continuar com Google
        </Button>

        {msg && <p className="mt-4 text-sm text-[#7A4A18]">{msg}</p>}

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-6 text-sm text-[#7A4A18] hover:underline w-full text-center cursor-pointer"
        >
          {mode === "login" ? "Não tem conta? Criar conta" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
}
