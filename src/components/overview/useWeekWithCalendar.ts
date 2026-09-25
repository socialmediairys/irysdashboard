import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listGoogleCalendarEvents } from "@/lib/google-calendar.functions";
import type { OverviewData } from "./useOverviewData";

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/** All-day events come as "YYYY-MM-DD"; parse as local date. */
const parse = (s: string) => (s.length <= 10 ? new Date(`${s}T00:00:00`) : new Date(s));

/** Merges the same Google Calendar events used by Agenda into "Sua semana". */
export function useWeekWithCalendar(week: OverviewData["week"] | undefined) {
  const listEvents = useServerFn(listGoogleCalendarEvents);
  const today = startOfDay(new Date());
  const q = useQuery({
    queryKey: ["overview-gcal", today.toISOString()],
    queryFn: () => listEvents({ data: { timeMin: today.toISOString(), timeMax: new Date(today.getTime() + 7 * DAY).toISOString() } }),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  return useMemo(() => {
    if (!week) return week;
    const out = week.map((d) => ({ ...d, items: [...d.items] }));
    const t0 = startOfDay(out[0].date).getTime();
    for (const e of q.data?.events ?? []) {
      if (!e.start) continue;
      const s = parse(e.start);
      const i = Math.floor((startOfDay(s).getTime() - t0) / DAY);
      if (i < 0 || i >= 7) continue;
      out[i].items.push({
        id: `g-${e.id}`,
        kind: "reuniao",
        title: e.title,
        time: e.allDay ? undefined : s.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        to: "/admin/agenda",
        href: e.htmlLink ?? undefined,
        sort: e.allDay ? s.getTime() - 1 : s.getTime(),
      });
    }
    for (const d of out) d.items.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    return out;
  }, [week, q.data]);
}
