import { Link } from "@tanstack/react-router";
import type { ActivityItem } from "./useOverviewData";

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 60) return `há ${Math.max(m, 1)} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `há ${d} dia${d > 1 ? "s" : ""}`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((a) => {
        const body = (
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-text-tertiary" />
            <div className="min-w-0 flex-1 text-sm">
              <span className="text-foreground">{a.label}</span>
              <span className="text-muted-foreground"> — {a.detail}</span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{ago(a.at)}</span>
          </div>
        );
        return (
          <li key={a.id}>
            {a.to ? (
              <Link to={a.to} params={a.params as never} search={a.params ? ({ tab: "dados" } as never) : undefined} className="block transition-colors hover:bg-accent/60">
                {body}
              </Link>
            ) : body}
          </li>
        );
      })}
    </ul>
  );
}
