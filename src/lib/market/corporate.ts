import { hkDate, hkParts } from "../format";
import { hkDayKey } from "./engine";
import {
  UNIVERSE,
  fundamentalScore,
  type Instrument,
} from "./universe";

export type Halt = {
  symbol: string;
  name: string;
  reason: string;
  untilKey: string;
  boostKey: string;
};

export type Report = {
  symbol: string;
  period: string;
  revenue: number;
  profit: number;
  yoy: number;
  surprise: number;
  at: number;
};

export type Dividend = {
  symbol: string;
  period: string;
  dps: number;
  exKey: string;
  payKey: string;
  exed: boolean;
  paid: boolean;
};

const HALT_DAY_CHANCE = 0.012;

const HALT_REASONS = [
  "待公布內幕消息",
  "待刊發業績／重大交易公告",
  "股價及成交量出現異常波動，待澄清",
  "核數／會計事項待澄清",
  "重大收購或出售協議洽談中",
];

const WINDOWS: { month: number; day: number; label: (y: number) => string }[] = [
  { month: 3, day: 12, label: (y) => `${y} 全年業績` },
  { month: 5, day: 6, label: (y) => `${y} 第一季業績` },
  { month: 8, day: 12, label: (y) => `${y} 中期業績` },
  { month: 11, day: 6, label: (y) => `${y} 第三季業績` },
];

const BASE_FIN: Record<string, { revenue: number; profit: number; yoy: number }> = {
  "0700": { revenue: 1612, profit: 428, yoy: 0.09 },
  "0005": { revenue: 1488, profit: 612, yoy: 0.04 },
  "9988": { revenue: 2240, profit: 286, yoy: 0.07 },
  "3690": { revenue: 812, profit: 38, yoy: 0.18 },
  "1810": { revenue: 768, profit: 52, yoy: 0.22 },
  "0941": { revenue: 1860, profit: 318, yoy: 0.03 },
  "1299": { revenue: 420, profit: 96, yoy: 0.08 },
  "0388": { revenue: 52, profit: 32, yoy: 0.06 },
  "2318": { revenue: 2180, profit: 268, yoy: 0.02 },
  "1211": { revenue: 1420, profit: 88, yoy: 0.16 },
  "0434": { revenue: 6.8, profit: 1.1, yoy: 0.14 },
  "0012": { revenue: 48, profit: 9.2, yoy: -0.06 },
  "0857": { revenue: 3120, profit: 412, yoy: 0.05 },
  "0992": { revenue: 980, profit: 22, yoy: 0.11 },
  "3988": { revenue: 1680, profit: 486, yoy: 0.03 },
  "9618": { revenue: 1180, profit: 64, yoy: 0.08 },
  "9999": { revenue: 268, profit: 72, yoy: 0.1 },
  "0001": { revenue: 92, profit: 18, yoy: 0.02 },
  "0002": { revenue: 86, profit: 11, yoy: 0.01 },
  "0011": { revenue: 210, profit: 48, yoy: 0.03 },
  "0175": { revenue: 620, profit: 28, yoy: 0.13 },
  "2020": { revenue: 186, profit: 24, yoy: 0.09 },
  "2382": { revenue: 72, profit: 6.4, yoy: 0.15 },
  "1024": { revenue: 310, profit: 14, yoy: 0.12 },
  "9961": { revenue: 148, profit: 32, yoy: 0.17 },
  "9888": { revenue: 268, profit: 36, yoy: 0.05 },
  "0027": { revenue: 438, profit: 82, yoy: 0.11 },
  "0293": { revenue: 1040, profit: 92, yoy: 0.08 },
  "2269": { revenue: 186, profit: 49, yoy: 0.18 },
  "2899": { revenue: 3050, profit: 322, yoy: 0.15 },
  "0020": { revenue: 38, profit: -8, yoy: 0.12 },
  "0981": { revenue: 620, profit: 48, yoy: 0.16 },
  "1888": { revenue: 230, profit: 42, yoy: 0.22 },
  "2513": { revenue: 18, profit: -6, yoy: 0.4 },
};

const ANNUAL_YIELD: Record<string, number> = {
  "0005": 0.055,
  "3988": 0.062,
  "0011": 0.05,
  "0002": 0.046,
  "0941": 0.054,
  "0857": 0.058,
  "0012": 0.052,
  "0001": 0.04,
  "2318": 0.044,
  "1299": 0.022,
  "0388": 0.028,
  "0700": 0.012,
  "9988": 0.008,
  "3690": 0.0,
  "1810": 0.0,
  "1211": 0.012,
  "0434": 0.018,
  "0992": 0.03,
  "9618": 0.0,
  "9999": 0.02,
  "0175": 0.01,
  "2020": 0.024,
  "2382": 0.012,
  "1024": 0.0,
  "9961": 0.0,
  "9888": 0.0,
  "0027": 0.018,
  "0293": 0.058,
  "2269": 0.0,
  "2899": 0.022,
  "0020": 0.0,
  "0981": 0.004,
  "1888": 0.013,
  "2513": 0.0,
};

function hashSym(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function addTradingDays(from: number, n: number): number {
  let t = from;
  let left = Math.max(0, n);
  while (left > 0) {
    t += 86_400_000;
    const p = hkParts(t);
    if (p.weekday >= 1 && p.weekday <= 5) left -= 1;
  }
  return t;
}

export function stockNames(): Instrument[] {
  return UNIVERSE.filter((i) => i.kind === "stock");
}

export function isHalted(halt: Halt | null | undefined, symbol: string, dayKey: string): boolean {
  return Boolean(halt && halt.symbol === symbol && dayKey < halt.untilKey);
}

export function volBoostFor(halt: Halt | null | undefined, symbol: string, dayKey: string): number {
  if (!halt || halt.symbol !== symbol) return 1;
  if (dayKey === halt.untilKey || dayKey === halt.boostKey) return 2.1;
  return 1;
}

export function rollHalt(clock: number, current: Halt | null): Halt | null {
  const day = hkDayKey(clock);
  if (current) {
    if (day < current.untilKey) return current;
    return null;
  }
  if (Math.random() >= HALT_DAY_CHANCE) return null;
  const pool = stockNames();
  const inst = pool[Math.floor(Math.random() * pool.length)]!;
  const days = 1 + Math.floor(Math.random() * 3);
  const until = addTradingDays(clock, days);
  const boost = addTradingDays(until, 1);
  return {
    symbol: inst.symbol,
    name: inst.name,
    reason: HALT_REASONS[Math.floor(Math.random() * HALT_REASONS.length)]!,
    untilKey: hkDayKey(until),
    boostKey: hkDayKey(boost),
  };
}

export function haltNews(halt: Halt, clock: number, kind: "start" | "resume") {
  const until = halt.untilKey.slice(5).replace("-", "/");
  const text =
    kind === "start"
      ? `${halt.name}（${halt.symbol}）停牌。${halt.reason}。預計 ${until} 復牌。`
      : `${halt.name}（${halt.symbol}）復牌。停牌期間累積消息，短線波幅或明顯擴大。`;
  return { id: `${clock}-halt${kind}`, text, at: clock };
}

function windowDay(year: number, month: number, day: number, symbol: string): { y: number; m: number; d: number } {
  const offset = hashSym(symbol) % 10;
  let t = hkDate(year, month, day, 9, 0) + offset * 86_400_000;
  for (let i = 0; i < 6; i++) {
    const p = hkParts(t);
    if (p.weekday >= 1 && p.weekday <= 5) return { y: p.year, m: p.month, d: p.day };
    t += 86_400_000;
  }
  const p = hkParts(t);
  return { y: p.year, m: p.month, d: p.day };
}

function resultCandidates(symbol: string, year: number) {
  const out: { dayKey: string; period: string; at: number }[] = [];
  for (const y of [year - 1, year, year + 1]) {
    for (const w of WINDOWS) {
      const d = windowDay(y, w.month, w.day, symbol);
      const at = hkDate(d.y, d.m, d.d, 9, 0);
      out.push({ dayKey: hkDayKey(at), period: w.label(y), at });
    }
  }
  out.sort((a, b) => a.at - b.at);
  return out;
}

export function lastResults(symbol: string, clock: number): { dayKey: string; period: string; at: number } {
  const p = hkParts(clock);
  const today = hkDayKey(clock);
  const candidates = resultCandidates(symbol, p.year);
  const past = candidates.filter((c) => c.dayKey < today);
  return past[past.length - 1] ?? candidates[0]!;
}

export function nextResults(symbol: string, clock: number): { dayKey: string; period: string; at: number } {
  const p = hkParts(clock);
  const today = hkDayKey(clock);
  const candidates = resultCandidates(symbol, p.year);
  return candidates.find((c) => c.dayKey >= today) ?? candidates[candidates.length - 1]!;
}

export function resultsDueToday(clock: number): { inst: Instrument; period: string }[] {
  const day = hkDayKey(clock);
  const out: { inst: Instrument; period: string }[] = [];
  for (const inst of stockNames()) {
    const n = nextResults(inst.symbol, clock);
    if (n.dayKey === day) out.push({ inst, period: n.period });
  }
  return out;
}

export function seedReport(inst: Instrument, clock: number): Report {
  const base = BASE_FIN[inst.symbol] ?? {
    revenue: Math.max(4, inst.start * 1.8),
    profit: Math.max(0.4, inst.start * 0.22),
    yoy: 0.04,
  };
  const prev = lastResults(inst.symbol, clock);
  return {
    symbol: inst.symbol,
    period: prev.period,
    revenue: base.revenue,
    profit: base.profit,
    yoy: base.yoy,
    surprise: 0,
    at: prev.at,
  };
}

export function seedReports(clock: number): Record<string, Report> {
  const out: Record<string, Report> = {};
  for (const inst of stockNames()) out[inst.symbol] = seedReport(inst, clock);
  return out;
}

export function publishReport(inst: Instrument, period: string, clock: number, prev: Report | undefined): Report {
  const q = fundamentalScore(inst.symbol);
  const surprise = gauss() * (0.035 + (1 - q) * 0.06);
  const lastYoy = prev?.yoy ?? 0.04;
  const yoy = lastYoy + surprise * 0.55 + gauss() * 0.015;
  const lastRev = prev?.revenue ?? BASE_FIN[inst.symbol]?.revenue ?? inst.start;
  const lastProfit = prev?.profit ?? BASE_FIN[inst.symbol]?.profit ?? inst.start * 0.2;
  return {
    symbol: inst.symbol,
    period,
    revenue: Math.max(0.2, lastRev * (1 + yoy * 0.35)),
    profit: lastProfit * (1 + yoy),
    yoy,
    surprise,
    at: clock,
  };
}

export function earningsNews(inst: Instrument, report: Report, clock: number) {
  const beat = report.surprise >= 0;
  const yoy = `${report.yoy >= 0 ? "+" : "−"}${Math.abs(report.yoy * 100).toFixed(1)}%`;
  const sur = `${beat ? "勝" : "遜"}預期 ${Math.abs(report.surprise * 100).toFixed(1)}%`;
  return {
    id: `${clock}-earn${inst.symbol}`,
    text: `${inst.name}公布${report.period}：營業額 ${report.revenue.toFixed(1)} 億，純利 ${report.profit.toFixed(1)} 億，按年 ${yoy}，${sur}。`,
    at: clock,
  };
}

export function earningsGap(report: Report): number {
  return report.surprise * 0.85 + (report.yoy > 0 ? 0.004 : -0.006);
}

export function formatYi(n: number): string {
  if (n >= 100) return `${n.toFixed(0)} 億`;
  if (n >= 10) return `${n.toFixed(1)} 億`;
  return `${n.toFixed(2)} 億`;
}

export function formatDayKey(key: string): string {
  const [y, m, d] = key.split("-");
  if (!y || !m || !d) return key;
  return `${y}/${m}/${d}`;
}

export function haltSet(halt: Halt | null | undefined, dayKey: string): Set<string> {
  if (halt && dayKey < halt.untilKey) return new Set([halt.symbol]);
  return new Set();
}

export function formatDps(n: number): string {
  if (n >= 0.1) return `HK$${n.toFixed(2)}`;
  return `HK$${n.toFixed(3)}`;
}

function roundDps(x: number): number {
  if (x >= 1) return Math.round(x * 20) / 20;
  if (x >= 0.1) return Math.round(x * 100) / 100;
  return Math.round(x * 1000) / 1000;
}

function eventPortion(period: string): number {
  if (period.includes("全年")) return 0.62;
  if (period.includes("中期")) return 0.38;
  return 0.12;
}

function willConsider(period: string, profit: number, quality: number, rand: number): boolean {
  if (profit <= 0) return false;
  const main = period.includes("全年") || period.includes("中期");
  if (main) return rand < 0.28 + quality * 0.7;
  return rand < 0.06 + quality * 0.08;
}

export function declareDividend(
  inst: Instrument,
  report: Report,
  clock: number,
  lastPrice: number,
  opts?: { rand?: number },
): Dividend | null {
  const q = fundamentalScore(inst.symbol);
  const rand = opts?.rand ?? Math.random();
  if (!willConsider(report.period, report.profit, q, rand)) return null;
  const yld = ANNUAL_YIELD[inst.symbol] ?? Math.max(0, 0.008 + q * 0.025);
  if (yld <= 0 && eventPortion(report.period) < 0.2) return null;
  const surprise = 1 + Math.max(-0.25, Math.min(0.25, report.surprise));
  const dps = roundDps(lastPrice * Math.max(yld, 0.006) * eventPortion(report.period) * surprise);
  if (dps < 0.005) return null;
  const exOff = 12 + (hashSym(inst.symbol + report.period) % 10);
  const payOff = 10 + (hashSym(inst.symbol + "pay") % 8);
  const exAt = addTradingDays(clock, exOff);
  const payAt = addTradingDays(exAt, payOff);
  return {
    symbol: inst.symbol,
    period: report.period,
    dps,
    exKey: hkDayKey(exAt),
    payKey: hkDayKey(payAt),
    exed: false,
    paid: false,
  };
}

export function seedDividends(
  clock: number,
  reports: Record<string, Report>,
  prices: Record<string, number>,
): Record<string, Dividend> {
  const out: Record<string, Dividend> = {};
  const today = hkDayKey(clock);
  for (const inst of stockNames()) {
    const rep = reports[inst.symbol];
    if (!rep) continue;
    const px = prices[inst.symbol] ?? inst.start;
    const div = declareDividend(inst, rep, rep.at || clock, px, {
      rand: (hashSym(inst.symbol + "seeddiv") % 1000) / 1000,
    });
    if (!div) continue;
    if (today > div.payKey) {
      div.exed = true;
      div.paid = true;
    } else if (today >= div.exKey) {
      div.exed = true;
    }
    out[inst.symbol] = div;
  }
  return out;
}

export function dividendNews(inst: Instrument, div: Dividend, clock: number, kind: "declare" | "ex" | "pay") {
  if (kind === "declare") {
    return {
      id: `${clock}-div${inst.symbol}`,
      text: `${inst.name}宣派${div.period}股息每股 ${formatDps(div.dps)}。除淨日 ${formatDayKey(div.exKey)}，派息日 ${formatDayKey(div.payKey)}。`,
      at: clock,
    };
  }
  if (kind === "ex") {
    return {
      id: `${clock}-ex${inst.symbol}`,
      text: `${inst.name}今日除淨，每股 ${formatDps(div.dps)}。派息日 ${formatDayKey(div.payKey)}。`,
      at: clock,
    };
  }
  return {
    id: `${clock}-pay${inst.symbol}`,
    text: `${inst.name}今日派息，每股 ${formatDps(div.dps)} 已按持股入帳。`,
    at: clock,
  };
}

export function skipDividendNews(inst: Instrument, period: string, clock: number) {
  return {
    id: `${clock}-divskip${inst.symbol}`,
    text: `${inst.name}公布${period}，有純利但董事會決定本期不派息。`,
    at: clock,
  };
}

export function exDivGap(dps: number, last: number): number {
  if (last <= 0) return 0;
  return -Math.min(0.08, dps / last);
}
