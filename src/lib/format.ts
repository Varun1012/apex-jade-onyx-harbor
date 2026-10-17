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
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 1e8) / 1e8;
  if (Number.isInteger(rounded)) return rounded.toLocaleString("en-HK");
  return rounded.toLocaleString("en-HK", { maximumFractionDigits: 8 });
}

export function formatPrice(n: number, ccy: "HKD" | "USD" | "JPY" = "HKD"): string {
  if (ccy === "USD") {
    const abs = Math.abs(n);
    const sign = n < 0 ? "−" : "";
    const digits = abs >= 1000 ? 0 : 2;
    return `${sign}US$${abs.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;
  }
  if (ccy === "JPY") {
    const abs = Math.abs(n);
    const sign = n < 0 ? "−" : "";
    return `${sign}¥${abs.toLocaleString("ja-JP", { maximumFractionDigits: abs >= 1000 ? 0 : 1 })}`;
  }
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

export function formatSimTime(ms: number, timeZone = "Asia/Hong_Kong"): string {
  const map: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms))) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const weekday = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[map.weekday ?? "Mon"] ?? 1;
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  return `週${days[weekday]} ${pad(hour)}:${pad(Number(map.minute))}`;
}

export function formatVol(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(abs / 100_000_000).toFixed(2)}億`;
  if (abs >= 10_000) return `${(abs / 10_000).toFixed(1)}萬`;
  return Math.round(abs).toLocaleString("en-HK");
}
