import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, FileText, Scale, UserCheck, Users, type LucideIcon } from "lucide-react";
import Painel360 from "@/components/Painel360";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Irys" }] }),
  component: ConfigRoute,
});

const LINKS: { to: string; label: string; desc: string; icon: LucideIcon }[] = [
  { to: "/admin/equipe", label: "Equipe", desc: "Membros e papéis", icon: Users },
  { to: "/admin/cadastros", label: "Cadastros pendentes", desc: "Aprovar novos clientes", icon: UserCheck },
  { to: "/admin/juridico", label: "Jurídico e documentos", desc: "Contratos e documentos", icon: Scale },
  { to: "/admin/portal-conteudos", label: "Portais dos clientes", desc: "Conteúdos da Central do Cliente", icon: FileText },
  { to: "/admin/agenda", label: "Agenda", desc: "Compromissos e Google Calendar", icon: CalendarDays },
];

function ConfigRoute() {
  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Equipe, cadastros, documentos, integrações e sua conta." className="mb-0" />
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Administração</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {LINKS.map(({ to, label, desc, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
            >
              <Icon size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <Painel360 section="config" />
    </div>
  );
}
