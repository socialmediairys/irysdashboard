import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { OverviewData } from "./useOverviewData";

type Item = OverviewData["week"][number]["items"][number];
const MAX = 3;

function ItemBody({ it }: { it: Item }) {
  const meta = [it.time, it.cliente ?? (it.kind === "tarefa" ? "Tarefa" : undefined)].filter(Boolean).join(" · ");
  return (
    <>
      <div className="truncate text-xs font-medium text-foreground">{it.title}</div>
      {meta && <div className="truncate text-[11px] text-muted-foreground">{meta}</div>}
    </>
  );
}

/** Next 7 days as columns (desktop) / stacked rows (mobile). */
export function WeekView({ week }: { week: OverviewData["week"] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const empty = week.every((d) => d.items.length === 0);
  return (
    <div className="grid divide-y divide-border md:grid-cols-7 md:divide-x md:divide-y-0">
      {week.map((d, i) => {
        const wd = d.date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
        const shown = open[i] ? d.items : d.items.slice(0, MAX);
        const rest = d.items.length - shown.length;
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
              {shown.map((it) => {
                const cls = cn(
                  "block rounded-md border-l-2 bg-secondary px-2 py-1.5 transition-colors hover:bg-accent",
                  it.kind === "reuniao" ? "border-primary" : "border-muted-foreground/40",
                );
                return it.href ? (
                  <a key={it.id} href={it.href} target="_blank" rel="noreferrer" className={cls} title={it.title}>
                    <ItemBody it={it} />
                  </a>
                ) : (
                  <Link key={it.id} to={it.to} search={it.search as never} className={cls} title={it.title}>
                    <ItemBody it={it} />
                  </Link>
                );
              })}
              {rest > 0 && (
                <button type="button" onClick={() => setOpen((o) => ({ ...o, [i]: true }))} className="px-2 text-[11px] text-muted-foreground hover:text-foreground">
                  +{rest} {rest === 1 ? "item" : "itens"}
                </button>
              )}
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
