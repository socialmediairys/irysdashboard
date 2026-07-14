import { useMemo, type ReactNode } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { C, ETAPA_COLS, brl, type LeadRow } from "@/components/Painel360";

const SHADOW = "0 2px 16px rgba(44,21,5,0.09)";

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="rounded-[18px] p-6 min-w-0"
      style={{ background: "#fff", color: C.text, boxShadow: SHADOW }}
    >
      <h3 className="font-extrabold text-lg mb-4">{title}</h3>
      {children}
    </div>
  );
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

export function ComercialCharts({ leads }: { leads: LeadRow[] }) {
  const areaData = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; valor: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: monthKey(d), label: monthLabel(d), valor: 0 });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    for (const l of leads) {
      if (l.etapa === "Fechado" || l.etapa === "Perdido") continue;
      const created = (l as unknown as { created_at?: string }).created_at;
      if (!created) continue;
      const d = new Date(created);
      const k = monthKey(d);
      const b = map.get(k);
      if (b) b.valor += Number(l.valor || 0);
    }
    return buckets;
  }, [leads]);

  const barData = useMemo(
    () =>
      ETAPA_COLS.filter((e) => e !== "Perdido").map((etapa) => ({
        etapa,
        qtd: leads.filter((l) => l.etapa === etapa).length,
      })),
    [leads],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-5 mb-6">
      <ChartCard title="Valor em funil · últimos 6 meses">
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={areaData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cmcArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.dark} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.dark} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.beige} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.textMid, fontSize: 12 }} axisLine={{ stroke: C.beige }} tickLine={false} />
              <YAxis tick={{ fill: C.textMid, fontSize: 12 }} axisLine={{ stroke: C.beige }} tickLine={false} width={70} tickFormatter={(v: number) => brl(v)} />
              <Tooltip
                contentStyle={{ background: "#fff", border: `1px solid ${C.beige}`, borderRadius: 12, color: C.text }}
                labelStyle={{ color: C.textMid, fontWeight: 700 }}
                formatter={(v: number) => [brl(v), "Em funil"]}
              />
              <Area type="monotone" dataKey="valor" stroke={C.dark} strokeWidth={2} fill="url(#cmcArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Leads por etapa do funil">
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 16, left: 20, bottom: 0 }}>
              <CartesianGrid stroke={C.beige} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textMid, fontSize: 12 }} axisLine={{ stroke: C.beige }} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="etapa" tick={{ fill: C.textMid, fontSize: 12 }} axisLine={{ stroke: C.beige }} tickLine={false} width={120} />
              <Tooltip
                contentStyle={{ background: "#fff", border: `1px solid ${C.beige}`, borderRadius: 12, color: C.text }}
                labelStyle={{ color: C.textMid, fontWeight: 700 }}
                formatter={(v: number) => [v, "Leads"]}
              />
              <Bar dataKey="qtd" fill={C.dark} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
