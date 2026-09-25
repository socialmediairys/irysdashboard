import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, CalendarDays, LogOut, Menu, Search, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function currentMonthLabel() {
  const s = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1).replace(" de ", " ");
}

export function AdminTopbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [pendentes, setPendentes] = useState(0);
  const [q, setQ] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? "");
      const { data: p } = await supabase.from("profiles").select("nome").eq("id", u.id).maybeSingle();
      setName((p as { nome?: string } | null)?.nome || u.email?.split("@")[0] || "");
      const { count } = await supabase
        .from("solicitacoes_cadastro")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendente");
      setPendentes(count ?? 0);
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const initial = (name || email || "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-8">
      <button
        onClick={onOpenMobile}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent md:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={20} strokeWidth={1.6} />
      </button>

      <form
        className="relative hidden max-w-md flex-1 sm:block"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/admin/clientes" });
          setQ("");
        }}
      >
        <Search size={15} strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar clientes, conteúdos, tarefas…"
          className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          aria-label="Buscar"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Link
          to="/admin/cadastros"
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={`Notificações${pendentes ? ` (${pendentes} cadastros pendentes)` : ""}`}
          title={pendentes ? `${pendentes} cadastro(s) pendente(s)` : "Sem pendências"}
        >
          <Bell size={17} strokeWidth={1.6} />
          {pendentes > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />}
        </Link>

        <div className="hidden h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground md:flex">
          <span>{currentMonthLabel()}</span>
          <CalendarDays size={15} strokeWidth={1.6} className="text-muted-foreground" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            aria-label="Menu da conta"
          >
            {initial}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="truncate text-sm font-medium text-foreground">{name}</div>
              <div className="truncate text-xs text-muted-foreground">{email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/admin/configuracoes" })}>
              <Settings size={15} strokeWidth={1.6} /> Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={signOut}>
              <LogOut size={15} strokeWidth={1.6} /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
