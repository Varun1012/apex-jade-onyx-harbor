import { hkDate, hkParts } from "../format";
import { UNIVERSE, roundTick, type Instrument } from "./universe";
import type { Quote } from "./engine";

export type Candle = { t: number; o: number; h: number; l: number; c: number };
export type Tf = "5m" | "15m" | "1d";
export type CandleBook = Record<string, Record<Tf, Candle[]>>;

const CAP: Record<Tf, number> = { "5m": 96, "15m": 80, "1d": 90 };

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
  return inst.kind === "index" ? Math.round(n) : roundTick(n);
}

function bar(inst: Instrument, t: number, close: number, vol: number, rand: () => number): Candle {
  const range = Math.max(close * vol * (0.35 + rand() * 0.7), close * 0.002);
  const o = px(inst, close + (rand() - 0.5) * range);
  const c = px(inst, close);
  const h = px(inst, Math.max(o, c) + rand() * range * 0.6);
  const l = px(inst, Math.max(0.01, Math.min(o, c) - rand() * range * 0.6));
  return { t, o, h, l, c };
}

function bucketStart(clock: number, tf: Tf): number {
  const p = hkParts(clock);
  if (tf === "1d") return hkDate(p.year, p.month, p.day, 9, 30);
  const step = tf === "5m" ? 5 : 15;
  const m = Math.floor(p.minute / step) * step;
  return hkDate(p.year, p.month, p.day, p.hour, m);
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

function seedSymbol(inst: Instrument, last: number, clock: number): Record<Tf, Candle[]> {
  const rand = rng(hashStr(inst.symbol + String(Math.round(last * 100))));
  const dailyCloses = walkCloses(inst, last, 70, rand);
  const daily: Candle[] = dailyCloses.map((c, i) => {
    const daysBack = dailyCloses.length - 1 - i;
    let t = clock - daysBack * 86_400_000;
    const hp = hkParts(t);
    t = hkDate(hp.year, hp.month, hp.day, 16, 0);
    return bar(inst, t, c, inst.vol, rand);
  });
  daily[daily.length - 1] = {
    ...daily[daily.length - 1]!,
    c: last,
    h: Math.max(daily[daily.length - 1]!.h, last),
    l: Math.min(daily[daily.length - 1]!.l, last),
  };

  const m15closes = walkCloses(inst, last, 64, rand);
  const m15: Candle[] = m15closes.map((c, i) => {
    const t = clock - (m15closes.length - 1 - i) * 15 * 60_000;
    return bar(inst, t, c, inst.vol * 0.45, rand);
  });

  const m5closes = walkCloses(inst, last, 78, rand);
  const m5: Candle[] = m5closes.map((c, i) => {
    const t = clock - (m5closes.length - 1 - i) * 5 * 60_000;
    return bar(inst, t, c, inst.vol * 0.3, rand);
  });

  return { "1d": daily, "15m": m15, "5m": m5 };
}

export function seedCandles(quotes: Record<string, Quote>, clock: number): CandleBook {
  const book: CandleBook = {};
  for (const inst of UNIVERSE) {
    const last = quotes[inst.symbol]?.last ?? inst.start;
    book[inst.symbol] = seedSymbol(inst, last, clock);
  }
  return book;
}

function pushTick(list: Candle[], next: Candle, cap: number): Candle[] {
  if (!list.length) return [next];
  const last = list[list.length - 1]!;
  if (last.t === next.t) {
    const merged: Candle = {
      t: last.t,
      o: last.o,
      h: Math.max(last.h, next.h),
      l: Math.min(last.l, next.l),
      c: next.c,
    };
    return list.slice(0, -1).concat(merged);
  }
  const out = list.concat(next);
  return out.length > cap ? out.slice(-cap) : out;
}

export function applyTickCandles(
  book: CandleBook,
  quotes: Record<string, Quote>,
  clock: number,
): CandleBook {
  const next: CandleBook = { ...book };
  for (const inst of UNIVERSE) {
    const q = quotes[inst.symbol];
    if (!q) continue;
    const c = q.last;
    const prev = book[inst.symbol] ?? seedSymbol(inst, c, clock);
    const frames: Record<Tf, Candle[]> = {
      "5m": prev["5m"] ?? [],
      "15m": prev["15m"] ?? [],
      "1d": prev["1d"] ?? [],
    };
    (Object.keys(frames) as Tf[]).forEach((tf) => {
      const t = bucketStart(clock, tf);
      frames[tf] = pushTick(frames[tf], { t, o: c, h: c, l: c, c }, CAP[tf]);
    });
    next[inst.symbol] = frames;
  }
  return next;
}

export function ensureCandles(
  book: CandleBook | undefined,
  quotes: Record<string, Quote>,
  clock: number,
): CandleBook {
  if (!book || Object.keys(book).length < UNIVERSE.length) {
    const seeded = seedCandles(quotes, clock);
    if (!book) return seeded;
    for (const inst of UNIVERSE) {
      if (!book[inst.symbol]) book[inst.symbol] = seeded[inst.symbol]!;
    }
    return book;
  }
  return book;
}
