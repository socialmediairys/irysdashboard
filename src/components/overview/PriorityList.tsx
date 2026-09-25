import { Link } from "@tanstack/react-router";
import { AlertCircle, CalendarClock, Clock, FileSignature, LifeBuoy, OctagonAlert, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyLine } from "./OverviewSection";
import type { Priority, PriorityKind } from "./useOverviewData";

const KIND: Record<PriorityKind, { icon: LucideIcon; label: string; urgent?: boolean }> = {
  tarefa_atrasada: { icon: AlertCircle, label: "Tarefa atrasada", urgent: true },
  etapa_travada: { icon: OctagonAlert, label: "Etapa travada", urgent: true },
  tarefa_hoje: { icon: Clock, label: "Vence hoje" },
  reuniao: { icon: CalendarClock, label: "Reunião próxima" },
  ticket: { icon: LifeBuoy, label: "Suporte" },
  recebimento: { icon: Wallet, label: "Recebimento" },
  contrato: { icon: FileSignature, label: "Contrato" },
};

function formatDue(d: Date | null, kind: PriorityKind) {
  if (!d) return "Este mês";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const time = kind === "reuniao" ? ` · ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "";
  if (diff === 0) return `Hoje${time}`;
  if (diff === 1) return `Amanhã${time}`;
  if (diff < 0) return `${Math.abs(diff)} dia${diff < -1 ? "s" : ""} atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + time;
}

export function PriorityList({ items, limit = 8 }: { items: Priority[]; limit?: number }) {
  if (!items.length) return <EmptyLine>Nada pendente agora. Tudo em dia.</EmptyLine>;
  return (
    <ul className="divide-y divide-border">
      {items.slice(0, limit).map((p) => {
        const k = KIND[p.kind];
        const Icon = k.icon;
        return (
          <li key={p.id} className="flex items-center gap-4 px-5 py-3.5">
            <Icon size={17} strokeWidth={1.6} className={cn("shrink-0", k.urgent ? "text-primary" : "text-muted-foreground")} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{p.title}</div>
              <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
                {k.label}
                {p.clienteNome && <> · {p.clienteNome}</>}
              </div>
            </div>
            <div className={cn("hidden shrink-0 text-[13px] sm:block", k.urgent ? "text-primary" : "text-muted-foreground")}>
              {formatDue(p.due, p.kind)}
            </div>
            <Link
              to={p.action.to}
              params={p.action.params as never}
              search={p.action.search as never}
              className="shrink-0 rounded-md border border-border px-2.5 py-1 text-[13px] font-medium text-foreground transition-colors hover:bg-accent"
            >
              {p.action.label}
            </Link>
          </li>
        );
      })}
      {items.length > limit && (
        <li className="px-5 py-3 text-[13px] text-muted-foreground">+ {items.length - limit} outras pendências</li>
      )}
    </ul>
  );
}
