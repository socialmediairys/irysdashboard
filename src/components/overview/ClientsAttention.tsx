import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { EmptyLine } from "./OverviewSection";
import type { AttentionClient } from "./useOverviewData";

export function ClientsAttention({ clients }: { clients: AttentionClient[] }) {
  if (!clients.length) return <EmptyLine>Nenhum cliente com pendência no momento.</EmptyLine>;
  return (
    <ul className="divide-y divide-border">
      {clients.map((c) => (
        <li key={c.id}>
          <Link
            to="/admin/clientes/$clienteId"
            params={{ clienteId: c.id }}
            search={{ tab: "visao-geral" }}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-accent/60"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
              {c.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{c.nome}</div>
              <div className="mt-0.5 truncate text-[13px] text-muted-foreground">{c.reasons.join(" · ")}</div>
            </div>
            <ChevronRight size={16} strokeWidth={1.6} className="shrink-0 text-text-tertiary" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
