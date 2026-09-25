import { Link } from "@tanstack/react-router";
import { ArrowLeft, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useCrud } from "@/components/crud/CrudProvider";
import { ClientStatusPill } from "@/components/clients/ClientStatusPill";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clientGroup, CONTRATO_LABEL } from "@/lib/client-workspace";
import { brl, type Workspace } from "./useClientWorkspace";
import { btnOutline } from "./ui";

export function ClientHeader({ ws }: { ws: Workspace }) {
  const { openEdit, openDelete } = useCrud();
  const c = ws.cliente;
  const onbPend = ws.onboarding.filter((o) => !o.concluido).length;
  const group = clientGroup(c.status_contrato, onbPend);
  const meta = [
    c.plano_label || c.plano_atual,
    c.valor_mensal != null ? `${brl(Number(c.valor_mensal))}/mês` : null,
    CONTRATO_LABEL[c.status_contrato],
  ].filter(Boolean);

  return (
    <div className="mb-6">
      <Link to="/admin/clientes" className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} strokeWidth={1.6} /> Clientes
      </Link>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-base font-semibold text-muted-foreground">
          {(c.init || c.nome.charAt(0)).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-[28px]">{c.nome}</h1>
            <ClientStatusPill group={group} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{meta.join(" · ")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => openEdit("cliente", c)} className={`${btnOutline} hidden sm:inline-flex`}>
            <Pencil size={14} strokeWidth={1.6} /> Editar
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent" aria-label="Mais ações">
              <MoreHorizontal size={16} strokeWidth={1.6} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="sm:hidden" onSelect={() => openEdit("cliente", c)}>
                <Pencil size={14} strokeWidth={1.6} /> Editar dados
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onSelect={() => openDelete("cliente", c)}>
                <Trash2 size={14} strokeWidth={1.6} /> Excluir cliente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
