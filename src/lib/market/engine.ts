import { hkDate, hkParts } from "../format";
import {
  BOYAA_SYMBOL,
  BTC_SYMBOL,
  BY_SYMBOL,
  NEWS_POOL,
  UNIVERSE,
  fundamentalScore,
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
  iep: number;
};

export type NewsItem = {
  id: string;
  text: string;
  at: number;
  extreme?: boolean;
  symbol?: string;
  sign?: 1 | -1;
};

export type ExtremeMove = {
  symbol: string;
  name: string;
  sign: 1 | -1;
  mag: number;
  fireAt: number;
  fired: boolean;
  text: string;
};

export type ExtremeSchedule = {
  dayKey: string;
  event: ExtremeMove | null;
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
  if (inst.kind === "crypto") return last >= 10_000 ? 5 : 2;
  if (last >= 200) return 2;
  return 1;
}

export function applySpread(inst: Instrument, last: number): Pick<Quote, "bid" | "ask" | "last"> {
  const t = inst.kind === "index" ? 1 : tickSize(last, inst.kind);
  const s = spreadTicks(inst, last);
  const lastR = inst.kind === "index" ? Math.round(last) : roundTick(last, inst.kind);
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
      iep: sp.last,
    };
  }
  return out;
}

export type SessionPhase =
  | "closed"
  | "open-input"
  | "open-cool"
  | "continuous"
  | "lunch"
  | "close-input"
  | "close-random";

export type AuctionBook = {
  dayKey: string;
  closeAt: number;
  morningDone: boolean;
  closeDone: boolean;
  target: Record<string, number>;
};

function weekdayMins(t: number): { weekday: number; mins: number; p: ReturnType<typeof hkParts> } {
  const p = hkParts(t);
  return { weekday: p.weekday, mins: p.hour * 60 + p.minute, p };
}

export function sessionPhase(t: number): SessionPhase {
  const { weekday, mins } = weekdayMins(t);
  if (weekday === 0 || weekday === 6) return "closed";
  if (mins >= 9 * 60 && mins < 9 * 60 + 20) return "open-input";
  if (mins >= 9 * 60 + 20 && mins < 9 * 60 + 30) return "open-cool";
  if (mins >= 9 * 60 + 30 && mins < 12 * 60) return "continuous";
  if (mins >= 12 * 60 && mins < 13 * 60) return "lunch";
  if (mins >= 13 * 60 && mins < 16 * 60) return "continuous";
  if (mins >= 16 * 60 && mins < 16 * 60 + 8) return "close-input";
  if (mins >= 16 * 60 + 8 && mins < 16 * 60 + 10) return "close-random";
  return "closed";
}

export function sessionLabel(t: number): string {
  switch (sessionPhase(t)) {
    case "open-input":
      return "開市競價 · 輸入買賣盤 09:00–09:20";
    case "open-cool":
      return "開市競價 · 冷靜期 09:20–09:30";
    case "continuous":
      return "持續交易";
    case "lunch":
      return "午休停市 12:00–13:00";
    case "close-input":
      return "收市競價 · 輸入買賣盤 16:00–16:08";
    case "close-random":
      return "收市競價 · 隨機對盤 16:08–16:10";
    default:
      return "休市";
  }
}

export function isContinuous(t: number): boolean {
  return sessionPhase(t) === "continuous";
}

export function isAuction(t: number): boolean {
  const p = sessionPhase(t);
  return p === "open-input" || p === "open-cool" || p === "close-input" || p === "close-random";
}

/** 09:00–09:30：未開持續交易，不應把 IEP／對盤價畫進陰陽燭。 */
export function isPreOpenSession(t: number): boolean {
  const p = sessionPhase(t);
  return p === "open-input" || p === "open-cool";
}

export function canEnterAuctionOrders(t: number): boolean {
  const p = sessionPhase(t);
  return p === "open-input" || p === "close-input";
}

export function isClockOn(t: number): boolean {
  const { weekday, mins } = weekdayMins(t);
  if (weekday === 0 || weekday === 6) return false;
  return (mins >= 9 * 60 && mins < 12 * 60) || (mins >= 13 * 60 && mins < 16 * 60 + 10);
}

export function usesHkAuction(inst: Instrument): boolean {
  return inst.kind !== "crypto";
}

export function nextMarketOpen(from: number): number {
  const p = hkParts(from);
  const mins = p.hour * 60 + p.minute;
  if (p.weekday >= 1 && p.weekday <= 5 && mins < 9 * 60) {
    return hkDate(p.year, p.month, p.day, 9, 0);
  }
  let t = hkDate(p.year, p.month, p.day, 9, 0) + 86_400_000;
  for (let i = 0; i < 8; i++) {
    const q = hkParts(t);
    if (q.weekday >= 1 && q.weekday <= 5) return hkDate(q.year, q.month, q.day, 9, 0);
    t += 86_400_000;
  }
  return t;
}

export function isSession(t: number): boolean {
  return isContinuous(t);
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
    } else if (mins >= 16 * 60 + 10 || p.weekday === 0 || p.weekday === 6) {
      cur = nextMarketOpen(cur);
    }
    left -= 1;
  }
  return cur;
}

export function hkDayKey(t: number): string {
  const p = hkParts(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

function sessionSlots(t: number): number[] {
  const p = hkParts(t);
  const slots: number[] = [];
  for (let m = 9 * 60 + 30; m < 12 * 60; m++) {
    slots.push(hkDate(p.year, p.month, p.day, Math.floor(m / 60), m % 60));
  }
  for (let m = 13 * 60; m < 16 * 60; m++) {
    slots.push(hkDate(p.year, p.month, p.day, Math.floor(m / 60), m % 60));
  }
  return slots;
}

const DAILY_EXTREME_CHANCE = 0.34;

const SURGE_REASONS = [
  "突然傳出被收購／重大合作，短線資金瘋狂追貨。",
  "停牌後復牌裂口高開，市場交投極度活躍。",
  "業績爆冷遠勝預期，買盤瞬間湧入。",
  "傳出戰略投資者入股，股價突然暴升。",
];

const CRASH_REASONS = [
  "突然傳出不利消息，沽盤湧現。",
  "大股東減持／盈利警告，股價裂口低開。",
  "監管傳聞發酵，短線資金恐慌出逃。",
  "流動性突然枯竭，股價無量暴跌。",
];

const CRYPTO_SURGE = [
  "巨鯨突然掃貨，現貨溢價急升。",
  "市場傳出大型機構增持，空頭回補引爆急升。",
  "鏈上活躍地址爆量，短線資金瘋狂追入。",
];

const CRYPTO_CRASH = [
  "槓桿多頭遭連環清算，價格無量暴跌。",
  "巨鯨向交易所大額轉入，拋壓湧現。",
  "風險情緒急凍，加密資產同步出逃。",
];

/** ~1 in 3 trading days. Weak-fundamental names dominate; blue chips almost never. */
export function rollExtremeEvent(clock: number): ExtremeSchedule {
  const dayKey = hkDayKey(clock);
  if (Math.random() >= DAILY_EXTREME_CHANCE) {
    return { dayKey, event: null };
  }

  const pool = UNIVERSE.filter((i) => i.kind === "stock" || i.kind === "crypto");
  const weights = pool.map((i) => {
    const q = fundamentalScore(i.symbol);
    return Math.pow(Math.max(0.02, 1 - q), 3);
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  let inst = pool[0]!;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]!;
    if (r <= 0) {
      inst = pool[i]!;
      break;
    }
  }

  const quality = fundamentalScore(inst.symbol);
  const sign: 1 | -1 = Math.random() < 0.48 ? 1 : -1;
  const mag = 0.105 + Math.random() * (0.1 + (1 - quality) * 0.4);
  const slots = sessionSlots(clock).filter((s) => s > clock);
  if (slots.length < 8) {
    return { dayKey, event: null };
  }
  const lo = 0;
  const hi = slots.length;
  const fireAt = slots[lo + Math.floor(Math.random() * (hi - lo))]!;
  const reasons =
    inst.kind === "crypto"
      ? sign > 0
        ? CRYPTO_SURGE
        : CRYPTO_CRASH
      : sign > 0
        ? SURGE_REASONS
        : CRASH_REASONS;
  const reason = reasons[Math.floor(Math.random() * reasons.length)]!;
  const pct = Math.round(mag * 100);
  const verb = sign > 0 ? "暴升" : "暴跌";
  const text = `${inst.name}（${inst.symbol}）${verb}逾 ${pct}%。${reason}`;

  return {
    dayKey,
    event: {
      symbol: inst.symbol,
      name: inst.name,
      sign,
      mag,
      fireAt,
      fired: false,
      text,
    },
  };
}

export type TickResult = {
  quotes: Record<string, Quote>;
  news: NewsItem | null;
  histories: Record<string, number[]>;
  extremeFired: boolean;
};

function writeQuote(
  next: Record<string, Quote>,
  nextHist: Record<string, number[]>,
  histories: Record<string, number[]>,
  inst: Instrument,
  quotes: Record<string, Quote>,
  raw: number,
): number {
  const q = quotes[inst.symbol]!;
  const sp = applySpread(inst, raw);
  next[inst.symbol] = {
    ...sp,
    open: q.open,
    high: Math.max(q.high, sp.last),
    low: Math.min(q.low, sp.last),
    prevClose: q.prevClose,
    iep: sp.last,
  };
  const h = histories[inst.symbol];
  if (h) {
    h.push(sp.last);
    if (h.length > 90) h.splice(0, h.length - 90);
    nextHist[inst.symbol] = h;
  } else {
    nextHist[inst.symbol] = [sp.last];
  }
  return sp.last;
}

export type MarketCtx = {
  halted?: Set<string>;
  volBoost?: Record<string, number>;
  gapAdj?: Record<string, number>;
};

export function stepMarket(
  quotes: Record<string, Quote>,
  histories: Record<string, number[]>,
  clock: number,
  extreme?: ExtremeSchedule | null,
  ctx?: MarketCtx,
): TickResult {
  const shock = gauss() * 0.0018;
  let news: NewsItem | null = null;
  let focus: string | undefined;
  let newsBias = 0;
  let extremeFired = false;

  const due =
    extreme?.event &&
    !extreme.event.fired &&
    clock >= extreme.event.fireAt &&
    Boolean(extreme.event.symbol);

  if (!due && Math.random() < 0.035) {
    const n = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)]!;
    news = { id: `${clock}-${Math.random().toString(36).slice(2, 7)}`, text: n.text, at: clock };
    newsBias = n.bias * (0.6 + Math.random() * 0.8);
    focus = n.focus;
  }

  const next: Record<string, Quote> = { ...quotes };
  const nextHist: Record<string, number[]> = { ...histories };

  const hsiInst = BY_SYMBOL.HSI!;
  let hsiLast = quotes.HSI?.last ?? hsiInst.start;

  const btcInst = BY_SYMBOL[BTC_SYMBOL];
  let btcReturn = 0;
  if (btcInst && quotes[BTC_SYMBOL]) {
    const q = quotes[BTC_SYMBOL]!;
    let raw: number;
    if (due && extreme!.event!.symbol === BTC_SYMBOL) {
      raw = q.last * (1 + extreme!.event!.sign * extreme!.event!.mag);
      extremeFired = true;
      news = {
        id: `${clock}-x${Math.random().toString(36).slice(2, 7)}`,
        text: extreme!.event!.text,
        at: clock,
        extreme: true,
        symbol: BTC_SYMBOL,
        sign: extreme!.event!.sign,
      };
    } else {
      const idio = gauss() * btcInst.vol * 0.22;
      const anchor = q.prevClose > 0 ? q.prevClose : btcInst.start;
      const meanRev = ((anchor - q.last) / anchor) * 0.003;
      let jump = shock * 0.35 + idio + meanRev;
      if (focus === BTC_SYMBOL) jump += newsBias * 0.05;
      else if (focus === BOYAA_SYMBOL) jump += newsBias * 0.03;
      else if (news) jump += newsBias * 0.008;
      if (due && extreme!.event!.symbol === BOYAA_SYMBOL) {
        jump += extreme!.event!.sign * extreme!.event!.mag * 0.35;
      }
      raw = q.last * (1 + jump);
    }
    btcReturn = raw / q.last - 1;
    writeQuote(next, nextHist, histories, btcInst, quotes, raw);
  }

  for (const inst of UNIVERSE) {
    if (inst.kind === "index" || inst.kind === "crypto") continue;
    if (ctx?.halted?.has(inst.symbol)) continue;
    const q = quotes[inst.symbol];
    if (!q) continue;
    let raw: number;
    if (due && inst.symbol === extreme!.event!.symbol) {
      raw = q.last * (1 + extreme!.event!.sign * extreme!.event!.mag);
      extremeFired = true;
      news = {
        id: `${clock}-x${Math.random().toString(36).slice(2, 7)}`,
        text: extreme!.event!.text,
        at: clock,
        extreme: true,
        symbol: inst.symbol,
        sign: extreme!.event!.sign,
      };
    } else {
      const boost = ctx?.volBoost?.[inst.symbol] ?? 1;
      const idio = gauss() * inst.vol * 0.18 * boost;
      const anchor = q.prevClose > 0 ? q.prevClose : inst.start;
      const meanRev = ((anchor - q.last) / anchor) * 0.004;
      let jump = shock * inst.beta + idio + meanRev;
      if (focus && inst.symbol === focus) jump += newsBias * 0.04;
      else if (news) jump += newsBias * 0.01 * inst.beta;
      if (inst.symbol === BOYAA_SYMBOL) {
        if (due && extreme!.event!.symbol === BTC_SYMBOL) {
          jump += extreme!.event!.sign * extreme!.event!.mag * 0.45;
        } else {
          jump += btcReturn * 0.5;
        }
      }
      raw = q.last * (1 + jump);
    }
    writeQuote(next, nextHist, histories, inst, quotes, raw);
  }

  const weighted = UNIVERSE.filter((i) => i.weight > 0);
  const base = weighted.reduce((s, i) => s + i.start * i.weight, 0);
  const now = weighted.reduce((s, i) => s + (next[i.symbol]?.last ?? i.start) * i.weight, 0);
  const implied = hsiInst.start * (now / base);
  const hsiJump = news && !focus && !news?.extreme ? newsBias * 80 : gauss() * 12;
  hsiLast = implied * 0.85 + hsiLast * 0.15 + hsiJump;
  writeQuote(next, nextHist, histories, hsiInst, quotes, hsiLast);

  const etf = BY_SYMBOL["2800"]!;
  const etfRaw = next.HSI.last / 1000;
  const eq = next["2800"]!;
  const etfSp = applySpread(etf, etfRaw);
  next["2800"] = {
    ...etfSp,
    open: eq.open,
    high: Math.max(eq.high, etfSp.last),
    low: Math.min(eq.low, etfSp.last),
    prevClose: eq.prevClose,
    iep: etfSp.last,
  };

  return { quotes: next, news, histories: nextHist, extremeFired };
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
      iep: q.last,
    };
  }
  return next;
}

export function rollAuctionBook(clock: number): AuctionBook {
  const p = hkParts(clock);
  const extra = Math.floor(Math.random() * 3);
  return {
    dayKey: hkDayKey(clock),
    closeAt: hkDate(p.year, p.month, p.day, 16, 8 + extra),
    morningDone: false,
    closeDone: false,
    target: {},
  };
}

function closeAuctionGap(inst: Instrument): number {
  let g = gauss() * inst.vol * 0.7;
  const min = inst.kind === "index" ? 0.0007 : 0.0012;
  if (Math.abs(g) < min) g = (Math.random() < 0.5 ? 1 : -1) * (min + Math.random() * min);
  return g;
}

function overnightGap(inst: Instrument): number {
  const q = fundamentalScore(inst.symbol);
  let gap = gauss() * inst.vol * 1.6;
  if (Math.random() < 0.1) {
    const mag = 0.012 + Math.random() * (0.025 + (1 - q) * 0.05);
    gap += (Math.random() < 0.5 ? 1 : -1) * mag;
  }
  return gap * (0.55 + (1 - q) * 1.2);
}

/** HK 休市期間 BTC 仍跟美股／環球加密盤走，翌日港股開市必須重訂價。 */
export function applyCryptoOvernight(
  quotes: Record<string, Quote>,
  clock: number,
): { quotes: Record<string, Quote>; btcGap: number; news: NewsItem | null } {
  const inst = BY_SYMBOL[BTC_SYMBOL];
  const q = quotes[BTC_SYMBOL];
  if (!inst || !q) return { quotes, btcGap: 0, news: null };
  const weekend = hkParts(clock).weekday === 1;
  const scale = weekend ? 2.15 : 1.2;
  let g = gauss() * inst.vol * 2.6 * scale;
  if (Math.random() < (weekend ? 0.28 : 0.16)) {
    g += (Math.random() < 0.5 ? 1 : -1) * (0.012 + Math.random() * 0.045) * scale;
  }
  const min = weekend ? 0.006 : 0.003;
  if (Math.abs(g) < min) {
    g = (g === 0 ? (Math.random() < 0.5 ? 1 : -1) : Math.sign(g)) * (min + Math.random() * min * 0.8);
  }
  g = Math.max(-0.12, Math.min(0.12, g));
  const base = q.prevClose > 0 ? q.prevClose : q.last;
  const last = roundTick(Math.max(tickSize(base, "crypto"), base * (1 + g)), "crypto");
  const sp = applySpread(inst, last);
  const next: Record<string, Quote> = {
    ...quotes,
    [BTC_SYMBOL]: {
      ...q,
      last: sp.last,
      bid: sp.bid,
      ask: sp.ask,
      open: sp.last,
      high: Math.max(q.high, sp.last),
      low: Math.min(q.low, sp.last),
      iep: sp.last,
    },
  };
  const realized = sp.last / base - 1;
  let news: NewsItem | null = null;
  if (Math.abs(realized) >= 0.01) {
    const pct = `${realized >= 0 ? "+" : "−"}${(Math.abs(realized) * 100).toFixed(1)}%`;
    const why = weekend ? "周末及美股時段加密貨幣持續交易" : "美股盤中及夜市帶動加密貨幣報價";
    news = {
      id: `btc-ovn-${hkDayKey(clock)}`,
      text: `Bitcoin 過夜${realized >= 0 ? "高開" : "低開"} ${pct}。${why}。`,
      at: clock,
      symbol: BTC_SYMBOL,
      sign: realized >= 0 ? 1 : -1,
    };
  }
  return { quotes: next, btcGap: realized, news };
}

export function beginAuctionSession(
  quotes: Record<string, Quote>,
  book: AuctionBook,
  kind: "open" | "close",
  ctx?: MarketCtx,
): { quotes: Record<string, Quote>; book: AuctionBook } {
  const target: Record<string, number> = { ...book.target };
  const next: Record<string, Quote> = { ...quotes };
  for (const inst of UNIVERSE) {
    const q = quotes[inst.symbol];
    if (!q) continue;
    if (ctx?.halted?.has(inst.symbol) || !usesHkAuction(inst)) {
      next[inst.symbol] = { ...q, iep: q.last };
      target[inst.symbol] = q.last;
      continue;
    }
    const base = kind === "open" ? q.prevClose : q.last;
    let g = kind === "open" ? overnightGap(inst) : closeAuctionGap(inst);
    if (kind === "open") g += ctx?.gapAdj?.[inst.symbol] ?? 0;
    const boost = ctx?.volBoost?.[inst.symbol] ?? 1;
    g *= Math.sqrt(boost);
    const raw = Math.max(tickSize(base, inst.kind), base * (1 + g));
    const tgt = inst.kind === "index" ? Math.round(raw) : roundTick(raw, inst.kind);
    target[inst.symbol] = tgt;
    next[inst.symbol] = { ...q, iep: q.last };
  }
  const hsi = next.HSI;
  const etf = next["2800"];
  if (hsi && etf) {
    target["2800"] = roundTick(target.HSI! / 1000, "etf");
    next["2800"] = { ...etf, iep: etf.last };
  }
  return { quotes: next, book: { ...book, target } };
}

export function stepAuctionIep(
  quotes: Record<string, Quote>,
  book: AuctionBook,
  ctx?: MarketCtx,
): Record<string, Quote> {
  const next: Record<string, Quote> = { ...quotes };
  for (const inst of UNIVERSE) {
    const q = quotes[inst.symbol];
    if (!q) continue;
    if (ctx?.halted?.has(inst.symbol) || !usesHkAuction(inst)) {
      next[inst.symbol] = { ...q, iep: q.last };
      continue;
    }
    const tgt = book.target[inst.symbol] ?? q.last;
    const cur = q.iep > 0 ? q.iep : q.last;
    const raw = cur + (tgt - cur) * 0.14 + gauss() * inst.vol * cur * 0.035;
    const iep = inst.kind === "index" ? Math.round(raw) : roundTick(raw, inst.kind);
    next[inst.symbol] = { ...q, iep, bid: iep, ask: iep };
  }
  const hsi = next.HSI;
  const etfQ = next["2800"];
  const etf = BY_SYMBOL["2800"];
  if (hsi && etfQ && etf) {
    const iep = roundTick(hsi.iep / 1000, etf.kind);
    next["2800"] = { ...etfQ, iep, bid: iep, ask: iep };
  }
  return next;
}

export function matchAuction(
  quotes: Record<string, Quote>,
  kind: "open" | "close",
  ctx?: MarketCtx,
): Record<string, Quote> {
  const next: Record<string, Quote> = { ...quotes };
  for (const inst of UNIVERSE) {
    const q = quotes[inst.symbol];
    if (!q) continue;
    if (ctx?.halted?.has(inst.symbol) || !usesHkAuction(inst)) {
      next[inst.symbol] = { ...q, iep: q.last };
      continue;
    }
    const px = q.iep > 0 ? q.iep : q.last;
    const sp = applySpread(inst, px);
    next[inst.symbol] = {
      ...sp,
      open: kind === "open" ? sp.last : q.open,
      high: Math.max(q.high, sp.last),
      low: Math.min(q.low, sp.last),
      prevClose: q.prevClose,
      iep: sp.last,
    };
  }
  const hsi = next.HSI;
  const etf = BY_SYMBOL["2800"];
  const eq = next["2800"];
  if (hsi && etf && eq) {
    const sp = applySpread(etf, hsi.last / 1000);
    next["2800"] = {
      ...sp,
      open: kind === "open" ? sp.last : eq.open,
      high: Math.max(eq.high, sp.last),
      low: Math.min(eq.low, sp.last),
      prevClose: eq.prevClose,
      iep: sp.last,
    };
  }
  return next;
}

export function auctionGapNews(
  quotes: Record<string, Quote>,
  clock: number,
  kind: "open" | "close",
): NewsItem {
  const focus = quotes["0700"] ?? quotes.HSI;
  const prev = focus?.prevClose || focus?.last || 1;
  const last = focus?.last || prev;
  const chg = (last - prev) / prev;
  const name = quotes["0700"] ? "騰訊控股" : "恒生指數";
  const verb = kind === "open" ? (chg >= 0 ? "高開" : "低開") : chg >= 0 ? "高收" : "低收";
  const pct = `${chg >= 0 ? "+" : "−"}${Math.abs(chg * 100).toFixed(2)}%`;
  const when = kind === "open" ? "開市競價對盤完畢，進入冷靜期至 09:30" : "收市競價隨機對盤完畢";
  return {
    id: `${clock}-auc${kind}`,
    text: `${when}。${name}${verb} ${pct}。對盤價與前收之間可出現裂口。`,
    at: clock,
  };
}
