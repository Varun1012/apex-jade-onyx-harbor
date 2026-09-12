import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { formatPrice } from "@/lib/format";

export function PriceChart({ data, up }: { data: number[]; up: boolean }) {
  const rows = data.map((v, i) => ({ i, v }));
  const stroke = up ? "var(--color-up)" : "var(--color-down)";
  const fill = up ? "var(--color-up-soft)" : "var(--color-down-soft)";
  return (
    <div className="h-40 w-full min-h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={() => ""}
            formatter={(v) => [formatPrice(Number(v)), "成交"]}
          />
          <Area type="monotone" dataKey="v" stroke={stroke} fill={fill} strokeWidth={1.6} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
