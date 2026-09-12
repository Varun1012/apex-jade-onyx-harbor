const HK = "Asia/Hong_Kong";

export function hkParts(ms: number) {
  const map: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-US", {
    timeZone: HK,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms))) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const weekday =
    { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[map.weekday ?? "Mon"] ?? 1;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function hkDate(y: number, m: number, d: number, h: number, min: number): number {
  return Date.parse(`${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:00+08:00`);
}

export function formatHkd(n: number, digits = 2): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}HK$${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 10_000_000) {
    return `${sign}HK$${(abs / 1_000_000).toFixed(2)}M`;
  }
  return `${sign}HK$${abs.toLocaleString("en-HK", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function formatQty(n: number): string {
  return n.toLocaleString("en-HK");
}

export function formatPrice(n: number): string {
  if (n >= 1000) return n.toFixed(1);
  if (n >= 100) return n.toFixed(2);
  if (n >= 10) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(3);
}

export function formatPct(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n * 100).toFixed(2)}%`;
}

export function formatSimTime(ms: number): string {
  const p = hkParts(ms);
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  return `週${days[p.weekday]} ${pad(p.hour)}:${pad(p.minute)}`;
}
