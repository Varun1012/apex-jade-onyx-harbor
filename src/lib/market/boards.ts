import { hkParts } from "../format";
import { BY_SYMBOL, UNIVERSE, roundTick, tickSize, type Instrument } from "./universe";
import type { Quote } from "./engine";

export type Board = "HK" | "JP" | "US";

const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function zonedParts(ms: number, timeZone: string) {
  const map: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms))) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    weekday: WD[map.weekday ?? "Mon"] ?? 1,
  };
}

export function boardOf(inst: { market?: Board } | undefined): Board {
  return inst?.market ?? "HK";
}

export type BoardPhase =
  | "closed"
  | "pre"
  | "open-input"
  | "open-cool"
  | "continuous"
  | "lunch"
  | "close-input"
  | "night";

function minsOf(p: { hour: number; minute: number }) {
  return p.hour * 60 + p.minute;
}

/** 東證現貨：08:00–08:50 前場競價、08:50–09:00 冷靜、09:00–11:30 前場、11:30–12:30 午休、12:30–15:25 後場、15:25–15:30 收市競價。日經期指夜盤另計。 */
export function jpPhase(t: number, nightIndex = false): BoardPhase {
  const p = zonedParts(t, "Asia/Tokyo");
  const mins = minsOf(p);
  const nightLate = p.weekday >= 1 && p.weekday <= 5 && mins >= 16 * 60 + 45;
  const nightEarly = p.weekday >= 2 && p.weekday <= 6 && mins < 6 * 60;
  if (nightIndex && (nightLate || nightEarly)) {
    if (mins >= 16 * 60 + 45 && mins < 17 * 60) return "open-input";
    if (mins >= 5 * 60 + 55 && mins < 6 * 60) return "close-input";
    return "night";
  }
  if (p.weekday === 0 || p.weekday === 6) return "closed";
  if (mins >= 8 * 60 && mins < 8 * 60 + 50) return "open-input";
  if (mins >= 8 * 60 + 50 && mins < 9 * 60) return "open-cool";
  if (mins >= 9 * 60 && mins < 11 * 60 + 30) return "continuous";
  if (mins >= 11 * 60 + 30 && mins < 12 * 60 + 30) return "lunch";
  if (mins >= 12 * 60 + 30 && mins < 15 * 60 + 25) return "continuous";
  if (mins >= 15 * 60 + 25 && mins < 15 * 60 + 30) return "close-input";
  return "closed";
}

/** 美股：04:00–09:00 盤前、09:00–09:25 開市競價、09:25–09:30 冷靜、09:30–15:50 日盤、15:50–16:00 收市競價、16:00–20:00 盤後。美東時間，含夏令。 */
export function usPhase(t: number): BoardPhase {
  const p = zonedParts(t, "America/New_York");
  if (p.weekday === 0 || p.weekday === 6) return "closed";
  const mins = minsOf(p);
  if (mins >= 4 * 60 && mins < 9 * 60) return "pre";
  if (mins >= 9 * 60 && mins < 9 * 60 + 25) return "open-input";
  if (mins >= 9 * 60 + 25 && mins < 9 * 60 + 30) return "open-cool";
  if (mins >= 9 * 60 + 30 && mins < 15 * 60 + 50) return "continuous";
  if (mins >= 15 * 60 + 50 && mins < 16 * 60) return "close-input";
  if (mins >= 16 * 60 && mins < 20 * 60) return "night";
  return "closed";
}

export function symbolPhase(t: number, inst: Instrument): BoardPhase {
  const m = boardOf(inst);
  if (m === "JP") return jpPhase(t, inst.symbol === "N225");
  if (m === "US") return usPhase(t);
  return "closed";
}

export function boardPhase(t: number, board: Board): BoardPhase {
  if (board === "JP") return jpPhase(t, false);
  if (board === "US") return usPhase(t);
  return "closed";
}

export function boardLabel(t: number, board: Board): string {
  if (board === "HK") return "";
  const ph = board === "JP" ? jpPhase(t, false) : usPhase(t);
  if (board === "JP") {
    switch (ph) {
      case "open-input":
        return "前場開市競價 · 08:00–08:50";
      case "open-cool":
        return "前場競價冷靜 · 08:50–09:00";
      case "continuous": {
        const mins = minsOf(zonedParts(t, "Asia/Tokyo"));
        return mins < 12 * 60 ? "前場持續 09:00–11:30" : "後場持續 12:30–15:25";
      }
      case "lunch":
        return "午休 11:30–12:30";
      case "close-input":
        return "收市競價 · 15:25–15:30";
      default:
        return jpPhase(t, true) === "night" || jpPhase(t, true) === "open-input" || jpPhase(t, true) === "close-input"
          ? "日經夜盤 17:00–06:00（現貨休市）"
          : "東證休市";
    }
  }
  switch (ph) {
    case "pre":
      return "盤前 04:00–09:00 美東";
    case "open-input":
      return "開市競價 · 09:00–09:25 美東";
    case "open-cool":
      return "開市競價冷靜 · 09:25–09:30";
    case "continuous":
      return "日盤 09:30–15:50 美東";
    case "close-input":
      return "收市競價 · 15:50–16:00";
    case "night":
      return "盤後 16:00–20:00 美東";
    default:
      return "美股休市";
  }
}

export function symbolLabel(t: number, inst: Instrument): string {
  const m = boardOf(inst);
  if (m === "HK") return "";
  const ph = symbolPhase(t, inst);
  if (m === "JP" && inst.symbol !== "N225") {
    const night = jpPhase(t, true);
    if (ph === "closed" && (night === "night" || night === "open-input" || night === "close-input")) {
      return "現貨休市 · 日經夜盤進行中";
    }
  }
  if (m === "JP" && inst.symbol === "N225") {
    const night = jpPhase(t, true);
    const cash = jpPhase(t, false);
    if (cash === "closed" && (night === "night" || night === "open-input" || night === "close-input")) {
      if (night === "open-input") return "日經夜盤競價 · 16:45–17:00";
      if (night === "close-input") return "日經夜盤收市競價 · 05:55–06:00";
      return "日經夜盤 17:00–06:00";
    }
  }
  return boardLabel(t, m);
}

export function boardRules(board: Board): string {
  if (board === "JP") {
    return "東證現貨（日本時間）：前場競價 08:00–09:00，前場 09:00–11:30，午休 11:30–12:30，後場 12:30–15:25，收市競價 15:25–15:30。日經225期指夜盤 17:00–翌晨 06:00（16:45 起接受競價）。現貨個股夜盤不交易。";
  }
  if (board === "US") {
    return "紐約／納斯達克（美東，含夏令）：盤前 04:00–09:00，開市競價 09:00–09:30，日盤 09:30–15:50，收市競價 15:50–16:00，盤後 16:00–20:00。三大指數與個股同一時段。";
  }
  return "港股：星期一至五。開市競價 09:00–09:20 輸入、09:20–09:30 冷靜；持續 09:30–12:00／13:00–16:00；收市競價 16:00–16:10。午休 12:00–13:00。";
}

function gauss() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export type FxState = {
  jpDay: string;
  usDay: string;
  jpNight: string;
  tgt: Record<string, number>;
};

export function emptyFx(): FxState {
  return { jpDay: "", usDay: "", jpNight: "", tgt: {} };
}

function dayKeyOf(p: { year: number; month: number; day: number }) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

function writePx(quotes: Record<string, Quote>, inst: Instrument, raw: number, iepOnly = false) {
  const q = quotes[inst.symbol];
  if (!q) return;
  const px = inst.kind === "index" ? Math.round(raw) : roundTick(Math.max(tickSize(raw, inst.kind), raw), inst.kind);
  if (iepOnly) {
    quotes[inst.symbol] = { ...q, iep: px, bid: px, ask: px };
    return;
  }
  const t = tickSize(px, inst.kind);
  const bid = inst.kind === "index" ? px - 1 : roundTick(Math.max(t, px - t), inst.kind);
  const ask = inst.kind === "index" ? px + 1 : roundTick(px + t, inst.kind);
  quotes[inst.symbol] = {
    ...q,
    last: px,
    bid,
    ask,
    open: q.open || px,
    high: Math.max(q.high, px),
    low: Math.min(q.low, px),
    prevClose: q.prevClose,
    iep: px,
  };
}

function rollOpen(quotes: Record<string, Quote>, fx: FxState, symbols: string[]) {
  for (const s of symbols) {
    const inst = BY_SYMBOL[s];
    const q = quotes[s];
    if (!inst || !q) continue;
    const gap = Math.max(-0.025, Math.min(0.025, gauss() * inst.vol * 1.15));
    const base = q.last;
    const tgt = inst.kind === "index" ? Math.round(base * (1 + gap)) : roundTick(base * (1 + gap), inst.kind);
    fx.tgt[s] = tgt;
    quotes[s] = { ...q, prevClose: q.last, iep: q.last, bid: q.last, ask: q.last, open: q.last, high: q.last, low: q.last };
  }
}

function walkAuction(quotes: Record<string, Quote>, fx: FxState, symbols: string[]) {
  for (const s of symbols) {
    const inst = BY_SYMBOL[s];
    const q = quotes[s];
    const tgt = fx.tgt[s];
    if (!inst || !q || !(tgt > 0)) continue;
    const cur = q.iep > 0 ? q.iep : q.last;
    writePx(quotes, inst, cur + (tgt - cur) * 0.18, true);
  }
}

function printMatch(quotes: Record<string, Quote>, symbols: string[]) {
  for (const s of symbols) {
    const inst = BY_SYMBOL[s];
    const q = quotes[s];
    if (!inst || !q) continue;
    writePx(quotes, inst, q.iep > 0 ? q.iep : q.last, false);
  }
}

function stepLive(quotes: Record<string, Quote>, symbols: string[], index: string, scale = 1) {
  const ix = BY_SYMBOL[index];
  const iq = quotes[index];
  if (ix && iq) {
    const jump = gauss() * ix.vol * 0.16 * scale;
    writePx(quotes, ix, iq.last * (1 + jump), false);
  }
  const idxRet = iq && quotes[index] ? quotes[index].last / iq.last - 1 : 0;
  for (const s of symbols) {
    if (s === index) continue;
    const inst = BY_SYMBOL[s];
    const q = quotes[s];
    if (!inst || !q || inst.kind === "index") continue;
    const jump = idxRet * inst.beta * 0.85 + gauss() * inst.vol * 0.18 * scale;
    writePx(quotes, inst, q.last * (1 + jump), false);
  }
}

const JP_CASH = () => UNIVERSE.filter((i) => i.market === "JP").map((i) => i.symbol);
const US_ALL = () => UNIVERSE.filter((i) => i.market === "US").map((i) => i.symbol);

export function foreignActive(t: number): boolean {
  const jp = jpPhase(t, false);
  const night = jpPhase(t, true);
  const us = usPhase(t);
  return jp !== "closed" || night === "night" || night === "open-input" || night === "close-input" || us !== "closed";
}

export function hkActive(t: number): boolean {
  const p = hkParts(t);
  if (p.weekday === 0 || p.weekday === 6) return false;
  const mins = p.hour * 60 + p.minute;
  return (mins >= 9 * 60 && mins < 12 * 60) || (mins >= 13 * 60 && mins < 16 * 60 + 10);
}

export function anyBoardActive(t: number): boolean {
  return hkActive(t) || foreignActive(t);
}

export function nextBoardActive(from: number): number {
  let t = from;
  for (let i = 0; i < 4000; i++) {
    t += 60_000;
    if (anyBoardActive(t)) return t;
  }
  return t;
}

export function stepForeign(
  quotesIn: Record<string, Quote>,
  clock: number,
  fxIn: FxState | null,
): { quotes: Record<string, Quote>; fx: FxState; moved: string[]; gap: boolean } {
  const quotes = { ...quotesIn };
  const fx: FxState = {
    jpDay: fxIn?.jpDay ?? "",
    usDay: fxIn?.usDay ?? "",
    jpNight: fxIn?.jpNight ?? "",
    tgt: { ...(fxIn?.tgt ?? {}) },
  };
  const moved: string[] = [];
  let gap = false;
  const jp = zonedParts(clock, "Asia/Tokyo");
  const us = zonedParts(clock, "America/New_York");
  const jpKey = dayKeyOf(jp);
  const usKey = dayKeyOf(us);
  const jpCashPh = jpPhase(clock, false);
  const jpNightPh = jpPhase(clock, true);
  const usPh = usPhase(clock);
  const cash = JP_CASH();
  const stocks = cash.filter((s) => s !== "N225");
  const usSyms = US_ALL();

  if ((jpCashPh === "open-input" || jpCashPh === "open-cool") && fx.jpDay !== jpKey) {
    rollOpen(quotes, fx, cash);
    fx.jpDay = jpKey;
  } else if (jpCashPh === "open-input" || jpCashPh === "open-cool" || jpCashPh === "close-input") {
    walkAuction(quotes, fx, cash);
  }
  if (jp.hour === 9 && jp.minute === 0 && fx.jpDay === jpKey) {
    printMatch(quotes, cash);
    gap = true;
    moved.push(...cash);
  } else if (jpCashPh === "continuous") {
    stepLive(quotes, cash, "N225", 1);
    moved.push(...cash);
  }
  if (jp.hour === 15 && jp.minute === 30) {
    printMatch(quotes, cash);
    moved.push(...cash);
  }

  const nightKey = jp.hour < 12 ? dayKeyOf(zonedParts(clock - 12 * 3600_000, "Asia/Tokyo")) : jpKey;
  if (jpNightPh === "open-input" && fx.jpNight !== nightKey) {
    rollOpen(quotes, fx, ["N225"]);
    fx.jpNight = nightKey;
  } else if (jpNightPh === "open-input" || jpNightPh === "close-input") {
    walkAuction(quotes, fx, ["N225"]);
  }
  if (jpNightPh === "night") {
    stepLive(quotes, ["N225"], "N225", 0.72);
    moved.push("N225");
  }
  if (jp.hour === 17 && jp.minute === 0) {
    printMatch(quotes, ["N225"]);
    gap = true;
    moved.push("N225");
  }
  if (jp.hour === 6 && jp.minute === 0 && jpNightPh === "closed") {
    printMatch(quotes, ["N225"]);
    moved.push("N225");
  }

  if ((usPh === "open-input" || usPh === "open-cool") && fx.usDay !== usKey) {
    rollOpen(quotes, fx, usSyms);
    fx.usDay = usKey;
  } else if (usPh === "open-input" || usPh === "open-cool" || usPh === "close-input") {
    walkAuction(quotes, fx, usSyms);
  }
  if (us.hour === 9 && us.minute === 30 && fx.usDay === usKey) {
    printMatch(quotes, usSyms);
    gap = true;
    moved.push(...usSyms);
  } else if (usPh === "pre") {
    stepLive(quotes, usSyms, "SPX", 0.55);
    moved.push(...usSyms);
  } else if (usPh === "continuous") {
    stepLive(quotes, usSyms, "SPX", 1);
    const dji = ["DJI", "JPM", "XOM", "LLY"];
    stepLive(quotes, dji, "DJI", 0.35);
    const nq = ["IXIC", "NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "AVGO", "TSLA"];
    stepLive(quotes, nq, "IXIC", 0.35);
    moved.push(...usSyms);
  } else if (usPh === "night") {
    stepLive(quotes, usSyms, "SPX", 0.45);
    moved.push(...usSyms);
  }
  if (us.hour === 16 && us.minute === 0) {
    printMatch(quotes, usSyms);
    moved.push(...usSyms);
  }

  void stocks;
  return { quotes, fx, moved: [...new Set(moved)], gap };
}
