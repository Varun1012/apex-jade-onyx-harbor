import { hkDate, hkParts } from "../format";
import { UNIVERSE, roundTick, volumeUnit, type Instrument } from "./universe";
import { isContinuous, type Quote } from "./engine";

export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };
export type Tf = "5m" | "15m" | "1d";
export type CandleBook = Record<string, Record<Tf, Candle[]>>;

const CAP: Record<Tf, number> = { "5m": 220, "15m": 140, "1d": 90 };
const STEP_MIN: Record<Exclude<Tf, "1d">, number> = { "5m": 5, "15m": 15 };
const TFS: Tf[] = ["5m", "15m", "1d"];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function px(inst: Instrument, n: number): number {
  return inst.kind === "index" ? Math.round(n) : roundTick(n, inst.kind);
}

function bar(
  inst: Instrument,
  t: number,
  close: number,
  vol: number,
  rand: () => number,
  minutes: number,
): Candle {
  const range = Math.max(close * vol * (0.35 + rand() * 0.7), close * 0.002);
  const o = px(inst, close + (rand() - 0.5) * range);
  const c = px(inst, close);
  const h = px(inst, Math.max(o, c) + rand() * range * 0.6);
  const l = px(inst, Math.max(0.01, Math.min(o, c) - rand() * range * 0.6));
  const unit = volumeUnit(inst);
  const span = Math.abs(c - o) / Math.max(close, 1e-9);
  const v = Math.max(
    1,
    Math.round(unit * (8 + rand() * 36) * minutes * (0.5 + span * 55)),
  );
  return { t, o, h, l, c, v };
}

function sessionMins(t: number): number | null {
  const p = hkParts(t);
  if (p.weekday < 1 || p.weekday > 5) return null;
  const mins = p.hour * 60 + p.minute;
  if ((mins >= 9 * 60 + 30 && mins < 12 * 60) || (mins >= 13 * 60 && mins < 16 * 60)) return mins;
  if (mins === 16 * 60) return mins;
  return null;
}

function inBarGrid(t: number, step: number): boolean {
  const mins = sessionMins(t);
  return mins != null && mins % step === 0;
}

function lastSessionBar(day: { year: number; month: number; day: number }, step: number): number {
  if (step <= 15) return hkDate(day.year, day.month, day.day, 16, 0);
  const last = 16 * 60 - step;
  return hkDate(day.year, day.month, day.day, Math.floor(last / 60), last % 60);
}

function prevTradingParts(from: { year: number; month: number; day: number }) {
  let d = hkDate(from.year, from.month, from.day, 9, 30) - 86_400_000;
  for (let i = 0; i < 8; i++) {
    const q = hkParts(d);
    if (q.weekday >= 1 && q.weekday <= 5) return q;
    d -= 86_400_000;
  }
  return hkParts(d);
}

export function bucketStart(clock: number, tf: Tf): number {
  const p = hkParts(clock);
  const mins = p.hour * 60 + p.minute;
  const preOpen = p.weekday >= 1 && p.weekday <= 5 && mins < 9 * 60 + 20;
  if (tf === "1d") {
    if (preOpen) {
      const prev = prevTradingParts(p);
      return hkDate(prev.year, prev.month, prev.day, 9, 30);
    }
    return hkDate(p.year, p.month, p.day, 9, 30);
  }
  const step = STEP_MIN[tf];
  if (preOpen) {
    return lastSessionBar(prevTradingParts(p), step);
  }
  const snapped = Math.floor(mins / step) * step;
  const t = hkDate(p.year, p.month, p.day, Math.floor(snapped / 60), snapped % 60);
  if (inBarGrid(t, step)) return t;
  if (p.weekday >= 1 && p.weekday <= 5 && mins >= 12 * 60 && mins < 13 * 60) {
    return hkDate(p.year, p.month, p.day, 11, 60 - step);
  }
  if (p.weekday >= 1 && p.weekday <= 5 && mins >= 16 * 60 && mins < 16 * 60 + 10) {
    return hkDate(p.year, p.month, p.day, 16, 0);
  }
  if (p.weekday >= 1 && p.weekday <= 5 && mins >= 16 * 60) return lastSessionBar(p, step);
  if (p.weekday >= 1 && p.weekday <= 5 && mins >= 9 * 60 + 20 && mins < 9 * 60 + 30) {
    return hkDate(p.year, p.month, p.day, 9, 30);
  }
  if (p.weekday >= 1 && p.weekday <= 5 && mins < 9 * 60) {
    return lastSessionBar(prevTradingParts(p), step);
  }
  return hkDate(p.year, p.month, p.day, 9, 30);
}

function prevBarTime(t: number, tf: Tf): number {
  if (tf === "1d") {
    const p = hkParts(t);
    let d = hkDate(p.year, p.month, p.day, 9, 30) - 86_400_000;
    for (let i = 0; i < 10; i++) {
      const q = hkParts(d);
      if (q.weekday >= 1 && q.weekday <= 5) return hkDate(q.year, q.month, q.day, 9, 30);
      d -= 86_400_000;
    }
    return d;
  }
  const step = STEP_MIN[tf];
  const p = hkParts(t);
  const mins = p.hour * 60 + p.minute;
  if (mins === 13 * 60) return hkDate(p.year, p.month, p.day, 11, 60 - step);
  if (mins === 9 * 60 + 30) {
    let d = hkDate(p.year, p.month, p.day, 9, 30) - 86_400_000;
    for (let i = 0; i < 6; i++) {
      const q = hkParts(d);
      if (q.weekday >= 1 && q.weekday <= 5) return lastSessionBar(q, step);
      d -= 86_400_000;
    }
  }
  return t - step * 60_000;
}

function barTimes(clock: number, tf: Tf, n: number): number[] {
  const out = [bucketStart(clock, tf)];
  while (out.length < n) out.unshift(prevBarTime(out[0]!, tf));
  return out;
}

function walkCloses(inst: Instrument, last: number, n: number, rand: () => number): number[] {
  const out = [last];
  let p = last;
  for (let i = 1; i < n; i++) {
    p = Math.max(last * 0.45, p * (1 + gauss(rand) * inst.vol * 0.55));
    out.push(px(inst, p));
  }
  return out.reverse();
}

function seedSymbol(
  inst: Instrument,
  last: number,
  dailyTimes: number[],
  m15times: number[],
  m5times: number[],
): Record<Tf, Candle[]> {
  const rand = rng(hashStr(inst.symbol + String(Math.round(last * 100))));
  const dailyCloses = walkCloses(inst, last, dailyTimes.length, rand);
  const daily = dailyTimes.map((t, i) => bar(inst, t, dailyCloses[i]!, inst.vol, rand, 330));
  const dLast = daily[daily.length - 1]!;
  daily[daily.length - 1] = {
    ...dLast,
    c: last,
    h: Math.max(dLast.h, last),
    l: Math.min(dLast.l, last),
  };

  const m15closes = walkCloses(inst, last, m15times.length, rand);
  const m15 = m15times.map((t, i) => bar(inst, t, m15closes[i]!, inst.vol * 0.45, rand, 15));

  const m5closes = walkCloses(inst, last, m5times.length, rand);
  const m5 = m5times.map((t, i) => bar(inst, t, m5closes[i]!, inst.vol * 0.3, rand, 5));

  return { "1d": daily, "15m": m15, "5m": m5 };
}

export function seedCandles(quotes: Record<string, Quote>, clock: number): CandleBook {
  const dailyTimes = barTimes(clock, "1d", 70);
  const m15times = barTimes(clock, "15m", 64);
  const m5times = barTimes(clock, "5m", 90);
  const book: CandleBook = {};
  for (const inst of UNIVERSE) {
    const last = quotes[inst.symbol]?.last ?? inst.start;
    book[inst.symbol] = seedSymbol(inst, last, dailyTimes, m15times, m5times);
  }
  return book;
}

function pushTick(list: Candle[], next: Candle, cap: number, gap = false): Candle[] {
  if (!list.length) {
    list.push(next);
    return list;
  }
  const last = list[list.length - 1]!;
  if (last.t === next.t) {
    if (gap) last.o = next.c;
    last.h = Math.max(last.h, next.h, next.c, last.o);
    last.l = Math.min(last.l, next.l, next.c, last.o);
    last.c = next.c;
    last.v = (last.v ?? 0) + (next.v ?? 0);
    return list;
  }
  const o = gap ? next.c : last.c;
  list.push({
    t: next.t,
    o,
    h: Math.max(o, next.c),
    l: Math.min(o, next.c),
    c: next.c,
    v: next.v ?? 0,
  });
  if (list.length > cap) list.splice(0, list.length - cap);
  return list;
}

export function applyTickCandles(
  book: CandleBook,
  quotes: Record<string, Quote>,
  clock: number,
  gap = false,
  skip?: Set<string>,
  useIep = false,
): CandleBook {
  const ts: Record<Tf, number> = {
    "5m": bucketStart(clock, "5m"),
    "15m": bucketStart(clock, "15m"),
    "1d": bucketStart(clock, "1d"),
  };
  for (const inst of UNIVERSE) {
    const q = quotes[inst.symbol];
    if (!q) continue;
    if (skip?.has(inst.symbol)) continue;
    const c = useIep && q.iep > 0 ? q.iep : q.last;
    const unit = volumeUnit(inst);
    const chg = q.prevClose ? Math.abs(c - q.prevClose) / q.prevClose : 0;
    const tickV = Math.max(1, Math.round(unit * (5 + Math.random() * 20) * (0.65 + chg * 70)));
    let prev = book[inst.symbol];
    if (!prev) {
      prev = seedSymbol(
        inst,
        c,
        barTimes(clock, "1d", 70),
        barTimes(clock, "15m", 64),
        barTimes(clock, "5m", 90),
      );
      book[inst.symbol] = prev;
    }
    for (const tf of TFS) {
      const list = prev[tf] ?? [];
      prev[tf] = pushTick(list, { t: ts[tf], o: c, h: c, l: c, c, v: tickV }, CAP[tf], gap);
    }
  }
  return book;
}

export function ensureCandles(
  book: CandleBook | undefined,
  quotes: Record<string, Quote>,
  clock: number,
): CandleBook {
  const seeded = seedCandles(quotes, clock);
  if (!book) return seeded;
  for (const inst of UNIVERSE) {
    const have = book[inst.symbol];
    if (!have) {
      book[inst.symbol] = seeded[inst.symbol]!;
      continue;
    }
    for (const tf of TFS) {
      if (!have[tf] || have[tf].length < 2) have[tf] = seeded[inst.symbol]![tf]!;
    }
  }
  return book;
}

export function alignCandleCloses(
  book: CandleBook,
  quotes: Record<string, Quote>,
): CandleBook {
  return book;
}

export function dropPrematureOpenBars(book: CandleBook, clock: number): CandleBook {
  const p = hkParts(clock);
  const mins = p.hour * 60 + p.minute;
  if (!(p.weekday >= 1 && p.weekday <= 5 && mins < 9 * 60 + 20)) return book;
  const first = hkDate(p.year, p.month, p.day, 9, 30);
  for (const inst of UNIVERSE) {
    const slot = book[inst.symbol];
    if (!slot) continue;
    for (const tf of TFS) {
      const list = slot[tf];
      if (!list?.length) continue;
      while (list.length && list[list.length - 1]!.t >= first) list.pop();
    }
  }
  return book;
}

export function adoptFormingBars(book: CandleBook, clock: number): CandleBook {
  if (!isContinuous(clock)) return book;
  for (const inst of UNIVERSE) {
    const slot = book[inst.symbol];
    if (!slot) continue;
    for (const tf of TFS) {
      const list = slot[tf];
      const last = list?.[list.length - 1];
      if (!last) continue;
      last.t = bucketStart(clock, tf);
    }
  }
  return book;
}

export function repairQuotesFromCandles(
  quotes: Record<string, Quote>,
  book: CandleBook,
): Record<string, Quote> {
  for (const inst of UNIVERSE) {
    const q = quotes[inst.symbol];
    const d = book[inst.symbol]?.["1d"]?.at(-1);
    if (!q || !d) continue;
    q.open = d.o;
    q.high = d.h;
    q.low = d.l;
  }
  return quotes;
}

function parseCandle(row: unknown): Candle | null {
  if (Array.isArray(row) && row.length >= 5) {
    const t = Number(row[0]);
    const o = Number(row[1]);
    const h = Number(row[2]);
    const l = Number(row[3]);
    const c = Number(row[4]);
    const v = Number(row[5]) || 0;
    if (![t, o, h, l, c].every(Number.isFinite)) return null;
    return { t, o, h, l, c, v };
  }
  if (row && typeof row === "object") {
    const r = row as Record<string, unknown>;
    const t = Number(r.t);
    const o = Number(r.o);
    const h = Number(r.h);
    const l = Number(r.l);
    const c = Number(r.c);
    const v = Number(r.v) || 0;
    if (![t, o, h, l, c].every(Number.isFinite)) return null;
    return { t, o, h, l, c, v };
  }
  return null;
}

export type CompactCandleBook = Record<string, Partial<Record<Tf, number[][]>>>;

export function compactCandleBook(book: CandleBook): CompactCandleBook {
  const out: CompactCandleBook = {};
  for (const inst of UNIVERSE) {
    const slot = book[inst.symbol];
    if (!slot) continue;
    const row: Partial<Record<Tf, number[][]>> = {};
    for (const tf of TFS) {
      const list = slot[tf];
      if (!list?.length) continue;
      row[tf] = list.map((c) => [c.t, c.o, c.h, c.l, c.c, c.v ?? 0]);
    }
    out[inst.symbol] = row;
  }
  return out;
}

export function expandCandleBook(saved: unknown): CandleBook | undefined {
  if (!saved || typeof saved !== "object") return undefined;
  const raw = saved as Record<string, unknown>;
  const book: CandleBook = {};
  let any = false;
  for (const inst of UNIVERSE) {
    const slot = raw[inst.symbol];
    if (!slot || typeof slot !== "object") continue;
    const rec = slot as Record<string, unknown>;
    const entry: Record<Tf, Candle[]> = { "5m": [], "15m": [], "1d": [] };
    for (const tf of TFS) {
      const rows = rec[tf];
      if (!Array.isArray(rows)) continue;
      const list: Candle[] = [];
      for (const row of rows) {
        const c = parseCandle(row);
        if (c) list.push(c);
      }
      if (list.length) entry[tf] = list;
    }
    if (entry["1d"].length || entry["15m"].length || entry["5m"].length) {
      book[inst.symbol] = entry;
      any = true;
    }
  }
  return any ? book : undefined;
}
