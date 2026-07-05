import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, LogOut, Mail } from "lucide-react";
import { toast } from "sonner";

export function AccountTab() {
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
      setNewEmail(data.user?.email ?? "");
      setLoading(false);
    })();
  }, []);

  const changePassword = async () => {
    if (pwd.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres");
      return;
    }
    if (pwd !== pwd2) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSavingPwd(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPwd("");
    setPwd2("");
    toast.success("Senha atualizada");
  };

  const changeEmail = async () => {
    if (!newEmail || newEmail === email) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setSavingEmail(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("E-mail de confirmação enviado. Verifique sua caixa de entrada.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando conta...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <h4 className="font-bold">E-mail de login</h4>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="conta-email">E-mail</Label>
            <Input
              id="conta-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <Button onClick={changeEmail} disabled={savingEmail || newEmail === email}>
            {savingEmail && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Atualizar e-mail
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Você receberá um link de confirmação no novo endereço.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          <h4 className="font-bold">Trocar senha</h4>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="conta-pwd">Nova senha</Label>
            <Input
              id="conta-pwd"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conta-pwd2">Confirmar senha</Label>
            <Input
              id="conta-pwd2"
              type="password"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={changePassword} disabled={savingPwd || !pwd}>
            {savingPwd && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar nova senha
          </Button>
        </div>
      </section>

      <section className="space-y-3 pt-4 border-t">
        <h4 className="font-bold">Sessão</h4>
        <Button variant="outline" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair da conta
        </Button>
      </section>
    </div>
  );
}
