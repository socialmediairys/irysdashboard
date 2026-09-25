import { GROUP_LABEL, type ClientGroup } from "@/lib/client-workspace";
import { cn } from "@/lib/utils";

const STYLE: Record<ClientGroup, string> = {
  ativo: "bg-success-soft text-success",
  onboarding: "bg-info-soft text-info",
  pausado: "bg-secondary text-muted-foreground",
};

export function ClientStatusPill({ group, className }: { group: ClientGroup; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-[12px] font-medium", STYLE[group], className)}>
      {GROUP_LABEL[group]}
    </span>
  );
}
