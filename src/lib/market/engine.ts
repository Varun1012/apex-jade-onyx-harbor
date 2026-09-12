import { hkDate, hkParts } from "../format";
import {
  BY_SYMBOL,
  NEWS_POOL,
  UNIVERSE,
  roundTick,
  tickSize,
  type Instrument,
} from "./universe";

export type Quote = {
  last: number;
  bid: number;
  ask: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
};

export type NewsItem = {
  id: string;
  text: string;
  at: number;
};

function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function spreadTicks(inst: Instrument, last: number): number {
  if (inst.kind === "index") return 2;
  if (inst.kind === "etf") return 1;
  if (last >= 200) return 2;
  return 1;
}

export function applySpread(inst: Instrument, last: number): Pick<Quote, "bid" | "ask" | "last"> {
  const t = inst.kind === "index" ? 1 : tickSize(last);
  const s = spreadTicks(inst, last);
  const lastR = inst.kind === "index" ? Math.round(last) : roundTick(last);
  const bid = lastR - t * s;
  const ask = lastR + t * s;
  return { last: lastR, bid: Math.max(t, bid), ask };
}

export function seedQuotes(): Record<string, Quote> {
  const out: Record<string, Quote> = {};
  for (const inst of UNIVERSE) {
    const sp = applySpread(inst, inst.start);
    out[inst.symbol] = {
      ...sp,
      open: sp.last,
      high: sp.last,
      low: sp.last,
      prevClose: sp.last,
    };
  }
  return out;
}

export function nextMarketOpen(from: number): number {
  const p = hkParts(from);
  const mins = p.hour * 60 + p.minute;
  if (p.weekday >= 1 && p.weekday <= 5 && mins < 9 * 60 + 30) {
    return hkDate(p.year, p.month, p.day, 9, 30);
  }
  let t = hkDate(p.year, p.month, p.day, 9, 30) + 86_400_000;
  for (let i = 0; i < 8; i++) {
    const q = hkParts(t);
    if (q.weekday >= 1 && q.weekday <= 5) return hkDate(q.year, q.month, q.day, 9, 30);
    t += 86_400_000;
  }
  return t;
}

export function isSession(t: number): boolean {
  const p = hkParts(t);
  if (p.weekday === 0 || p.weekday === 6) return false;
  const mins = p.hour * 60 + p.minute;
  const morning = mins >= 9 * 60 + 30 && mins < 12 * 60;
  const afternoon = mins >= 13 * 60 && mins < 16 * 60;
  return morning || afternoon;
}

export function advanceClock(t: number, minutes: number): number {
  let cur = t;
  let left = minutes;
  while (left > 0) {
    cur += 60_000;
    const p = hkParts(cur);
    const mins = p.hour * 60 + p.minute;
    if (mins === 12 * 60) {
      cur = hkDate(p.year, p.month, p.day, 13, 0);
    } else if (mins >= 16 * 60 || p.weekday === 0 || p.weekday === 6) {
      cur = nextMarketOpen(cur);
    }
    left -= 1;
  }
  return cur;
}

export type TickResult = {
  quotes: Record<string, Quote>;
  news: NewsItem | null;
  histories: Record<string, number[]>;
};

export function stepMarket(
  quotes: Record<string, Quote>,
  histories: Record<string, number[]>,
  clock: number,
): TickResult {
  const shock = gauss() * 0.0018;
  let news: NewsItem | null = null;
  let focus: string | undefined;
  let newsBias = 0;

  if (Math.random() < 0.035) {
    const n = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)]!;
    news = { id: `${clock}-${Math.random().toString(36).slice(2, 7)}`, text: n.text, at: clock };
    newsBias = n.bias * (0.6 + Math.random() * 0.8);
    focus = n.focus;
  }

  const next: Record<string, Quote> = { ...quotes };
  const nextHist: Record<string, number[]> = { ...histories };

  const hsiInst = BY_SYMBOL.HSI!;
  let hsiLast = quotes.HSI?.last ?? hsiInst.start;

  for (const inst of UNIVERSE) {
    if (inst.symbol === "HSI") continue;
    const q = quotes[inst.symbol]!;
    const idio = gauss() * inst.vol * 0.18;
    const meanRev = ((inst.start - q.last) / inst.start) * 0.004;
    let jump = shock * inst.beta + idio + meanRev;
    if (focus && inst.symbol === focus) jump += newsBias * 0.04;
    else if (news) jump += newsBias * 0.01 * inst.beta;
    const raw = q.last * (1 + jump);
    const sp = applySpread(inst, raw);
    const dayOpen = q.open;
    next[inst.symbol] = {
      ...sp,
      open: dayOpen,
      high: Math.max(q.high, sp.last),
      low: Math.min(q.low, sp.last),
      prevClose: q.prevClose,
    };
    const h = (nextHist[inst.symbol] ?? []).concat(sp.last);
    nextHist[inst.symbol] = h.length > 90 ? h.slice(-90) : h;
  }

  const weighted = UNIVERSE.filter((i) => i.weight > 0);
  const base = weighted.reduce((s, i) => s + i.start * i.weight, 0);
  const now = weighted.reduce((s, i) => s + (next[i.symbol]?.last ?? i.start) * i.weight, 0);
  const implied = hsiInst.start * (now / base);
  const hsiJump = news && !focus ? newsBias * 80 : gauss() * 12;
  hsiLast = implied * 0.85 + hsiLast * 0.15 + hsiJump;
  const hsiSp = applySpread(hsiInst, hsiLast);
  const hq = quotes.HSI!;
  next.HSI = {
    ...hsiSp,
    open: hq.open,
    high: Math.max(hq.high, hsiSp.last),
    low: Math.min(hq.low, hsiSp.last),
    prevClose: hq.prevClose,
  };
  const hh = (nextHist.HSI ?? []).concat(hsiSp.last);
  nextHist.HSI = hh.length > 90 ? hh.slice(-90) : hh;

  const etf = BY_SYMBOL["2800"]!;
  const etfRaw = next.HSI.last / 1000;
  const etfSp = applySpread(etf, etfRaw);
  const eq = next["2800"]!;
  next["2800"] = {
    ...etfSp,
    open: eq.open,
    high: Math.max(eq.high, etfSp.last),
    low: Math.min(eq.low, etfSp.last),
    prevClose: eq.prevClose,
  };

  return { quotes: next, news, histories: nextHist };
}

export function rollDay(quotes: Record<string, Quote>): Record<string, Quote> {
  const next: Record<string, Quote> = {};
  for (const [sym, q] of Object.entries(quotes)) {
    next[sym] = {
      ...q,
      open: q.last,
      high: q.last,
      low: q.last,
      prevClose: q.last,
    };
  }
  return next;
}
