import { useMemo, type ReactNode } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Palette matches the app's theme tokens (defined in Painel360). We duplicate
// the raw values here to avoid pulling the entire Painel360 module into this
// standalone chart bundle.
const C = {
  dark: "#2C1505",
  mid: "#7A4A18",
  gold: "#C9A46E",
  beige: "#E8D8C0",
  beigeLight: "#F5EEE5",
  text: "#1A0A02",
  textMid: "#7A6050",
};
const SHADOW = "0 2px 16px rgba(44,21,5,0.09)";
const brl = (n: number) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

type Mov = { valor: number; data_ref: string; categoria: string | null };

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

// Produce a series of ordered shades between two hex colors.
function shadesBetween(from: string, to: string, count: number) {
  const hexToRgb = (h: string) => {
    const s = h.replace("#", "");
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const out: string[] = [];
  const n = Math.max(1, count);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const rgb = a.map((v, idx) => Math.round(v + (b[idx] - v) * t));
    out.push("#" + rgb.map(toHex).join(""));
  }
  return out;
}

export function FinanceiroCharts({ entradas, saidas }: { entradas: Mov[]; saidas: Mov[] }) {
  const lineData = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; entradas: number; saidas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: monthKey(d), label: monthLabel(d), entradas: 0, saidas: 0 });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    const push = (arr: Mov[], field: "entradas" | "saidas") => {
      for (const m of arr) {
        if (!m.data_ref) continue;
        const k = monthKey(new Date(m.data_ref + "T00:00:00"));
        const b = map.get(k);
        if (b) b[field] += Number(m.valor || 0);
      }
    };
    push(entradas, "entradas");
    push(saidas, "saidas");
    return buckets;
  }, [entradas, saidas]);

  const currentKey = useMemo(() => monthKey(new Date()), []);
  const donutData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of saidas) {
      if (!s.data_ref) continue;
      if (monthKey(new Date(s.data_ref + "T00:00:00")) !== currentKey) continue;
      const cat = s.categoria?.trim() || "Sem categoria";
      totals.set(cat, (totals.get(cat) ?? 0) + Number(s.valor || 0));
    }
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [saidas, currentKey]);

  const donutColors = useMemo(
    () => shadesBetween(C.dark, C.gold, Math.max(donutData.length, 1)),
    [donutData.length],
  );
  const donutTotal = donutData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-5">
      <ChartCard title="Entradas × Saídas · últimos 6 meses">
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.beige} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.textMid, fontSize: 12 }} axisLine={{ stroke: C.beige }} tickLine={false} />
              <YAxis tick={{ fill: C.textMid, fontSize: 12 }} axisLine={{ stroke: C.beige }} tickLine={false} width={80} tickFormatter={(v: number) => brl(v)} />
              <Tooltip
                contentStyle={{ background: "#fff", border: `1px solid ${C.beige}`, borderRadius: 12, color: C.text }}
                labelStyle={{ color: C.textMid, fontWeight: 700 }}
                formatter={(v: number, name: string) => [brl(v), name === "entradas" ? "Entradas" : "Saídas"]}
              />
              <Legend wrapperStyle={{ color: C.textMid, fontSize: 12 }} formatter={(v) => (v === "entradas" ? "Entradas" : "Saídas")} />
              <Line type="monotone" dataKey="entradas" stroke={C.dark} strokeWidth={2.5} dot={{ r: 3, fill: C.dark }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="saidas" stroke={C.gold} strokeWidth={2.5} dot={{ r: 3, fill: C.gold }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Saídas por categoria · mês atual">
        {donutData.length === 0 ? (
          <div className="text-sm py-10 text-center" style={{ color: C.textMid }}>
            Sem saídas registradas neste mês.
          </div>
        ) : (
          <>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={donutColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#fff", border: `1px solid ${C.beige}`, borderRadius: 12, color: C.text }}
                    formatter={(v: number, n: string) => [brl(v), n]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {donutData.map((d, i) => {
                const pct = donutTotal ? Math.round((d.value / donutTotal) * 100) : 0;
                return (
                  <li key={d.name} className="flex items-center justify-between gap-3" style={{ color: C.text }}>
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full inline-block flex-shrink-0" style={{ background: donutColors[i] }} />
                      <span className="truncate">{d.name}</span>
                    </span>
                    <span className="font-semibold whitespace-nowrap" style={{ color: C.textMid }}>
                      {brl(d.value)} · {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </ChartCard>
    </div>
  );
}
