import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { OverviewData } from "./useOverviewData";

/** Next 7 days as columns (desktop) / stacked rows (mobile). */
export function WeekView({ week }: { week: OverviewData["week"] }) {
  const empty = week.every((d) => d.items.length === 0);
  return (
    <div className="grid divide-y divide-border md:grid-cols-7 md:divide-x md:divide-y-0">
      {week.map((d, i) => {
        const wd = d.date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
        return (
          <div key={d.date.toISOString()} className="min-h-0 p-3 md:min-h-40">
            <div className="mb-2 flex items-baseline gap-1.5 md:block">
              <div className={cn("text-xs capitalize", i === 0 ? "text-primary" : "text-muted-foreground")}>
                {i === 0 ? "Hoje" : wd}
              </div>
              <div className={cn("text-base font-semibold", i === 0 ? "text-primary" : "text-foreground")}>
                {d.date.getDate()}
              </div>
            </div>
            <div className="space-y-1.5">
              {d.items.map((it) => (
                <Link
                  key={it.id}
                  to={it.to}
                  className={cn(
                    "block rounded-md border-l-2 bg-secondary px-2 py-1.5 transition-colors hover:bg-accent",
                    it.kind === "reuniao" ? "border-primary" : "border-muted-foreground/40",
                  )}
                >
                  <div className="truncate text-xs font-medium text-foreground">{it.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {[it.time, it.cliente ?? (it.kind === "tarefa" ? "Tarefa" : undefined)].filter(Boolean).join(" · ")}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
      {empty && (
        <div className="px-5 py-3 text-center text-[13px] text-muted-foreground md:col-span-7 md:border-t md:border-border">
          Nenhuma reunião ou tarefa com prazo nos próximos 7 dias.
        </div>
      )}
    </div>
  );
}
