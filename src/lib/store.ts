import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  GOAL_EQUITY,
  STARTING_CASH,
  UNIVERSE,
  BY_SYMBOL,
} from "./market/universe";
import { hkParts } from "./format";
import {
  declareDividend,
  dividendNews,
  earningsGap,
  earningsNews,
  exDivGap,
  haltNews,
  haltSet,
  isHalted,
  publishReport,
  resultsDueToday,
  rollHalt,
  seedDividends,
  seedReports,
  skipDividendNews,
  volBoostFor,
  type Dividend,
  type Halt,
  type Report,
} from "./market/corporate";
import {
  adoptFormingBars,
  applyTickCandles,
  compactCandleBook,
  dropPrematureOpenBars,
  ensureCandles,
  expandCandleBook,
  repairQuotesFromCandles,
  seedCandles,
  type CandleBook,
} from "./market/candles";
import {
  advanceClock,
  auctionGapNews,
  beginAuctionSession,
  canEnterAuctionOrders,
  hkDayKey,
  isClockOn,
  isContinuous,
  matchAuction,
  nextMarketOpen,
  rollAuctionBook,
  rollDay,
  rollExtremeEvent,
  seedQuotes,
  sessionPhase,
  stepAuctionIep,
  stepMarket,
  usesHkAuction,
  type AuctionBook,
  type ExtremeSchedule,
  type NewsItem,
  type Quote,
} from "./market/engine";

export type Side = "buy" | "sell";

export type Position = {
  symbol: string;
  qty: number;
  avgPrice: number;
  leverage: number;
};

export type Fill = {
  id: string;
  clock: number;
  symbol: string;
  side: Side;
  qty: number;
  price: number;
  leverage: number;
};

export type AuctionOrder = {
  symbol: string;
  side: Side;
  qty: number;
  leverage: number;
};

export type Speed = 0 | 1 | 4 | 12;

type DeskState = {
  cash: number;
  clock: number;
  quotes: Record<string, Quote>;
  histories: Record<string, number[]>;
  candles: CandleBook;
  positions: Position[];
  fills: Fill[];
  news: NewsItem[];
  speed: Speed;
  selected: string;
  won: boolean;
  busted: boolean;
  toast: string | null;
  musicOn: boolean;
  extreme: ExtremeSchedule | null;
  auction: AuctionBook;
  pending: AuctionOrder | null;
  halt: Halt | null;
  reports: Record<string, Report>;
  earnFired: Record<string, boolean>;
  dividends: Record<string, Dividend>;
  hydrateHistories: () => void;
  select: (symbol: string) => void;
  setSpeed: (s: Speed) => void;
  setMusicOn: (on: boolean) => void;
  tick: () => void;
  place: (side: Side, qty: number, leverage: number) => string | null;
  closeSymbol: (symbol: string) => void;
  reset: () => void;
  clearToast: () => void;
};

function seedClock(): number {
  return new Date("2026-09-14T01:00:00Z").getTime();
}

function seedHistories(quotes: Record<string, Quote>): Record<string, number[]> {
  const h: Record<string, number[]> = {};
  for (const inst of UNIVERSE) h[inst.symbol] = [quotes[inst.symbol]!.last];
  return h;
}

function mergeHistories(
  existing: Record<string, number[]>,
  quotes: Record<string, Quote>,
): Record<string, number[]> {
  const out = { ...existing };
  for (const inst of UNIVERSE) {
    const last = quotes[inst.symbol]?.last ?? inst.start;
    if (!out[inst.symbol]?.length) out[inst.symbol] = [last];
  }
  return out;
}

function mergeQuotes(existing: Record<string, Quote>): Record<string, Quote> {
  const seeded = seedQuotes();
  const out = { ...seeded, ...existing };
  for (const inst of UNIVERSE) {
    const q = out[inst.symbol] ?? seeded[inst.symbol]!;
    out[inst.symbol] = {
      ...q,
      iep: typeof q.iep === "number" && q.iep > 0 ? q.iep : q.last,
    };
  }
  return out;
}

function initial() {
  const quotes0 = seedQuotes();
  const clock = seedClock();
  const started = beginAuctionSession(quotes0, rollAuctionBook(clock), "open");
  return {
    cash: STARTING_CASH,
    clock,
    quotes: started.quotes,
    histories: seedHistories(started.quotes),
    candles: seedCandles(started.quotes, clock),
    positions: [] as Position[],
    fills: [] as Fill[],
    news: [] as NewsItem[],
    speed: 1 as Speed,
    selected: "0700",
    won: false,
    busted: false,
    toast: null as string | null,
    musicOn: false,
    extreme: null as ExtremeSchedule | null,
    auction: started.book,
    pending: null as AuctionOrder | null,
    halt: null as Halt | null,
    reports: seedReports(clock),
    earnFired: {} as Record<string, boolean>,
    dividends: seedDividends(
      clock,
      seedReports(clock),
      Object.fromEntries(UNIVERSE.map((i) => [i.symbol, started.quotes[i.symbol]?.last ?? i.start])),
    ),
  };
}

function markPrice(q: Quote, qty: number): number {
  if (qty > 0) return q.bid;
  if (qty < 0) return q.ask;
  return q.last;
}

function notional(symbol: string, qty: number, price: number): number {
  const inst = BY_SYMBOL[symbol]!;
  return Math.abs(qty) * price * inst.pointValue;
}

export function positionValue(p: Position, q: Quote): number {
  const inst = BY_SYMBOL[p.symbol]!;
  const mtm = markPrice(q, p.qty);
  const pnl = (mtm - p.avgPrice) * p.qty * inst.pointValue;
  const margin = notional(p.symbol, p.qty, p.avgPrice) / p.leverage;
  return margin + pnl;
}

export function equityOf(cash: number, positions: Position[], quotes: Record<string, Quote>): number {
  return cash + positions.reduce((s, p) => s + positionValue(p, quotes[p.symbol]!), 0);
}

function isAuctionPhaseWalk(clock: number, auction: AuctionBook): boolean {
  const ph = sessionPhase(clock);
  if (ph === "open-input") return !auction.morningDone;
  if (ph === "close-input" || ph === "close-random") return !auction.closeDone;
  return false;
}

function liquidateIfNeeded(
  cash: number,
  positions: Position[],
  quotes: Record<string, Quote>,
): { cash: number; positions: Position[]; toast: string | null } {
  if (!positions.length) return { cash, positions, toast: null };
  const liquidated: string[] = [];
  const kept = positions.filter((p) => {
    const q = quotes[p.symbol];
    if (!q) return true;
    const inst = BY_SYMBOL[p.symbol]!;
    const mtm = markPrice(q, p.qty);
    const pnl = (mtm - p.avgPrice) * p.qty * inst.pointValue;
    const margin = notional(p.symbol, p.qty, p.avgPrice) / p.leverage;
    if (p.leverage > 1 && pnl <= -margin * 0.8) {
      cash += Math.max(0, margin + pnl);
      liquidated.push(p.symbol);
      return false;
    }
    return true;
  });
  return {
    cash,
    positions: liquidated.length ? kept : positions,
    toast: liquidated.length
      ? `${liquidated.map((s) => BY_SYMBOL[s]?.name ?? s).join("、")} 已強制平倉`
      : null,
  };
}

function fillPending(
  pending: AuctionOrder,
  quotes: Record<string, Quote>,
  cash: number,
  positions: Position[],
  fills: Fill[],
  clock: number,
): { cash: number; positions: Position[]; fills: Fill[]; toast: string } | null {
  const inst = BY_SYMBOL[pending.symbol];
  const q = quotes[pending.symbol];
  if (!inst || !q) return null;
  const price = q.iep > 0 ? q.iep : q.last;
  const side = pending.side;
  const qty = pending.qty;
  const signed = side === "buy" ? qty : -qty;
  const lev = pending.leverage;
  let nextPos = positions.map((p) => ({ ...p }));
  const idx = nextPos.findIndex((p) => p.symbol === pending.symbol);
  const existing = idx >= 0 ? nextPos[idx]! : null;
  if (existing && Math.sign(existing.qty) !== 0 && Math.sign(existing.qty) !== Math.sign(signed)) {
    const closeQty = Math.min(Math.abs(existing.qty), qty);
    const closeSigned = existing.qty > 0 ? -closeQty : closeQty;
    const pnl = (price - existing.avgPrice) * (existing.qty > 0 ? closeQty : -closeQty) * inst.pointValue;
    const marginRelease = notional(pending.symbol, closeQty, existing.avgPrice) / existing.leverage;
    cash += marginRelease + pnl;
    const remain = existing.qty + closeSigned;
    if (Math.abs(remain) < 1e-12) nextPos.splice(idx, 1);
    else nextPos[idx] = { ...existing, qty: remain };
  } else if (existing && existing.leverage === lev) {
    const newQty = existing.qty + signed;
    const newAvg =
      (existing.avgPrice * Math.abs(existing.qty) + price * qty) / Math.abs(newQty);
    nextPos[idx] = { ...existing, qty: newQty, avgPrice: newAvg };
  } else if (existing) {
    return {
      cash,
      positions,
      fills,
      toast: "競價對盤失敗：請先平倉再改槓桿",
    };
  } else {
    const cost = notional(pending.symbol, qty, price) / lev;
    if (cost > cash + 1e-6) {
      return { cash, positions, fills, toast: "競價對盤失敗，現金不足" };
    }
    cash -= cost;
    nextPos.push({ symbol: pending.symbol, qty: signed, avgPrice: price, leverage: lev });
  }
  const nextFills = [
    {
      id: `${clock}-auc${Math.random().toString(36).slice(2, 7)}`,
      clock,
      symbol: pending.symbol,
      side,
      qty,
      price,
      leverage: lev,
    },
    ...fills,
  ].slice(0, 80);
  return {
    cash,
    positions: nextPos,
    fills: nextFills,
    toast: `競價對盤成交 ${inst.name} ${side === "buy" ? "買入" : "賣出"} ${qty} @ ${price}`,
  };
}

function marketCtx(halt: Halt | null, dayKey: string, gapAdj?: Record<string, number>) {
  const halted = haltSet(halt, dayKey);
  const volBoost: Record<string, number> = {};
  if (halt) {
    const b = volBoostFor(halt, halt.symbol, dayKey);
    if (b !== 1) volBoost[halt.symbol] = b;
  }
  return { halted, volBoost, gapAdj };
}

function openTradingDay(
  clock: number,
  quotes: Record<string, Quote>,
  halt: Halt | null,
  reports: Record<string, Report>,
  earnFired: Record<string, boolean>,
  dividends: Record<string, Dividend>,
  positions: Position[],
  extraNews: NewsItem[],
) {
  const dayKey = hkDayKey(clock);
  let nextHalt = halt;
  if (halt && dayKey >= halt.untilKey) {
    extraNews.push(haltNews(halt, clock, "resume"));
    nextHalt = null;
  }
  const due = resultsDueToday(clock);
  const nextReports = { ...reports };
  const nextFired = { ...earnFired };
  const nextDivs = { ...dividends };
  const gapAdj: Record<string, number> = {};
  for (const { inst, period } of due) {
    const key = `${inst.symbol}:${dayKey}`;
    if (nextFired[key]) continue;
    const rep = publishReport(inst, period, clock, nextReports[inst.symbol]);
    nextReports[inst.symbol] = rep;
    nextFired[key] = true;
    extraNews.push(earningsNews(inst, rep, clock));
    gapAdj[inst.symbol] = earningsGap(rep);
    const last = quotes[inst.symbol]?.last ?? inst.start;
    const main = period.includes("全年") || period.includes("中期");
    if (rep.profit > 0) {
      const div = declareDividend(inst, rep, clock, last);
      if (div) {
        nextDivs[inst.symbol] = div;
        extraNews.push(dividendNews(inst, div, clock, "declare"));
      } else if (main) {
        extraNews.push(skipDividendNews(inst, period, clock));
      }
    } else if (main) {
      extraNews.push(skipDividendNews(inst, period, clock));
    }
  }
  for (const [sym, div] of Object.entries(nextDivs)) {
    const inst = BY_SYMBOL[sym];
    if (!inst) continue;
    if (!div.exed && dayKey >= div.exKey) {
      const last = quotes[sym]?.last ?? inst.start;
      gapAdj[sym] = (gapAdj[sym] ?? 0) + exDivGap(div.dps, last);
      nextDivs[sym] = { ...div, exed: true };
      extraNews.push(dividendNews(inst, div, clock, "ex"));
    }
  }
  let payout = 0;
  const payNotes: string[] = [];
  for (const [sym, div] of Object.entries(nextDivs)) {
    const inst = BY_SYMBOL[sym];
    if (!inst || div.paid || dayKey < div.payKey) continue;
    nextDivs[sym] = { ...div, paid: true, exed: true };
    const pos = positions.find((p) => p.symbol === sym);
    if (pos) {
      const amt = pos.qty * div.dps * inst.pointValue;
      payout += amt;
      payNotes.push(`${inst.name} ${amt >= 0 ? "+" : ""}${amt.toFixed(0)}`);
    }
    extraNews.push(dividendNews(inst, div, clock, "pay"));
  }
  if (halt && dayKey === halt.untilKey) {
    const sign = Math.random() < 0.5 ? 1 : -1;
    gapAdj[halt.symbol] = (gapAdj[halt.symbol] ?? 0) + sign * (0.028 + Math.random() * 0.055);
  }
  if (!nextHalt) {
    const rolled = rollHalt(clock, null);
    if (rolled && !due.some((d) => d.inst.symbol === rolled.symbol)) {
      nextHalt = rolled;
      extraNews.push(haltNews(rolled, clock, "start"));
    }
  }
  const rolledQuotes = rollDay(quotes);
  const auction = rollAuctionBook(clock);
  const ctx = marketCtx(nextHalt, dayKey, gapAdj);
  const started = beginAuctionSession(rolledQuotes, auction, "open", ctx);
  return {
    quotes: started.quotes,
    auction: started.book,
    halt: nextHalt,
    reports: nextReports,
    earnFired: nextFired,
    dividends: nextDivs,
    payout,
    payToast: payNotes.length ? `派息入帳 ${payNotes.join("、")}` : null,
    ctx,
  };
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
const persistBuffer = { name: "", value: "" };
const CANDLE_KEY = "hk-paper-desk-candles-v1";

function loadCandleBook(): CandleBook | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(CANDLE_KEY);
    if (!raw) return undefined;
    return expandCandleBook(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

function saveCandleBook(book: CandleBook) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CANDLE_KEY, JSON.stringify(compactCandleBook(book)));
  } catch {
    try {
      const slim = compactCandleBook(book);
      for (const sym of Object.keys(slim)) {
        delete slim[sym]!["5m"];
      }
      localStorage.setItem(CANDLE_KEY, JSON.stringify(slim));
    } catch {
      /* quota */
    }
  }
}

function flushPersist() {
  if (!persistBuffer.name) return;
  try {
    localStorage.setItem(persistBuffer.name, persistBuffer.value);
  } catch {
    /* quota */
  }
}

export const useDesk = create<DeskState>()(
  persist(
    (set, get) => ({
      ...initial(),
      hydrateHistories: () => {
        const st = get();
        let quotes = mergeQuotes(st.quotes);
        let auction = st.auction ?? rollAuctionBook(st.clock);
        if (sessionPhase(st.clock) === "open-input" && Object.keys(auction.target || {}).length === 0) {
          const started = beginAuctionSession(quotes, auction, "open");
          quotes = started.quotes;
          auction = started.book;
        }
        const restored = loadCandleBook();
        const candles = dropPrematureOpenBars(
          adoptFormingBars(
            ensureCandles(restored ?? st.candles, quotes, st.clock),
            st.clock,
          ),
          st.clock,
        );
        repairQuotesFromCandles(quotes, candles);
        const histories = mergeHistories(st.histories, quotes);
        set({ quotes, candles, histories, auction });
        saveCandleBook(candles);
      },
      select: (symbol) => set({ selected: symbol }),
      setSpeed: (s) => set({ speed: s }),
      setMusicOn: (on) => set({ musicOn: on }),
      clearToast: () => set({ toast: null }),
      tick: () => {
        const st = get();
        if (st.won || st.busted || st.speed === 0) return;
        let clock = advanceClock(st.clock, 1);
        if (!isClockOn(clock)) clock = nextMarketOpen(clock);
        const p = hkParts(clock);
        const dayKey = hkDayKey(clock);
        let quotes = st.quotes;
        let auction = st.auction ?? rollAuctionBook(clock);
        let pending = st.pending;
        let candles = dropPrematureOpenBars(st.candles ?? seedCandles(quotes, clock), clock);
        let cash = st.cash;
        let positions = st.positions;
        let fills = st.fills;
        let news = st.news;
        let toast = st.toast;
        let halt = st.halt;
        let reports = st.reports && Object.keys(st.reports).length ? st.reports : seedReports(clock);
        let earnFired = st.earnFired ?? {};
        let dividends =
          st.dividends && Object.keys(st.dividends).length
            ? st.dividends
            : seedDividends(
                clock,
                reports,
                Object.fromEntries(UNIVERSE.map((i) => [i.symbol, quotes[i.symbol]?.last ?? i.start])),
              );
        const extraNews: NewsItem[] = [];

        if (auction.dayKey !== dayKey) {
          auction = rollAuctionBook(clock);
        }

        let ctx = marketCtx(halt, dayKey);

        if (p.hour === 9 && p.minute === 0) {
          const opened = openTradingDay(clock, quotes, halt, reports, earnFired, dividends, positions, extraNews);
          quotes = opened.quotes;
          auction = opened.auction;
          halt = opened.halt;
          reports = opened.reports;
          earnFired = opened.earnFired;
          dividends = opened.dividends;
          ctx = opened.ctx;
          if (opened.payout) cash += opened.payout;
          if (opened.payToast) toast = opened.payToast;
        } else if (p.hour === 16 && p.minute === 0 && !auction.closeDone) {
          const started = beginAuctionSession(quotes, auction, "close", ctx);
          quotes = started.quotes;
          auction = started.book;
        }

        const morningMatch = p.hour === 9 && p.minute === 20 && !auction.morningDone;
        const closeMatch =
          !auction.closeDone &&
          p.hour === 16 &&
          p.minute >= 8 &&
          p.minute <= 10 &&
          clock >= auction.closeAt;

        if (morningMatch || closeMatch) {
          const kind = morningMatch ? "open" : "close";
          quotes = matchAuction(quotes, kind, ctx);
          if (kind === "close") {
            candles = applyTickCandles(candles, quotes, clock, false, ctx.halted);
          }
          if (morningMatch) auction = { ...auction, morningDone: true };
          else auction = { ...auction, closeDone: true };
          extraNews.push(auctionGapNews(quotes, clock, kind));
          if (pending && !ctx.halted.has(pending.symbol)) {
            const filled = fillPending(pending, quotes, cash, positions, fills, clock);
            if (filled) {
              cash = filled.cash;
              positions = filled.positions;
              fills = filled.fills;
              toast = filled.toast;
              pending = null;
            }
          }
          if (closeMatch) {
            clock = nextMarketOpen(clock);
            const opened = openTradingDay(clock, quotes, halt, reports, earnFired, dividends, positions, extraNews);
            quotes = opened.quotes;
            auction = opened.auction;
            halt = opened.halt;
            reports = opened.reports;
            earnFired = opened.earnFired;
            dividends = opened.dividends;
            ctx = opened.ctx;
            if (opened.payout) cash += opened.payout;
            if (opened.payToast) toast = opened.payToast;
          }
        } else if (isContinuous(clock)) {
          let extreme = st.extreme ?? null;
          if (!extreme || extreme.dayKey !== dayKey) {
            extreme = rollExtremeEvent(clock);
          }
          if (extreme?.event && ctx.halted.has(extreme.event.symbol) && !extreme.event.fired) {
            extreme = { ...extreme, event: { ...extreme.event, fired: true } };
          }
          const stepped = stepMarket(quotes, st.histories, clock, extreme, ctx);
          quotes = stepped.quotes;
          const gapOpen = p.hour === 9 && p.minute === 30;
          candles = applyTickCandles(candles, quotes, clock, gapOpen, ctx.halted);
          if (stepped.extremeFired && extreme.event) {
            extreme = { ...extreme, event: { ...extreme.event, fired: true } };
          }
          if (stepped.news) extraNews.push(stepped.news);
          const liq = liquidateIfNeeded(cash, positions, quotes);
          cash = liq.cash;
          positions = liq.positions;
          if (liq.toast) toast = liq.toast;
          const eq = equityOf(cash, positions, quotes);
          set({
            clock,
            quotes,
            histories: stepped.histories,
            candles,
            cash,
            positions,
            fills,
            news: extraNews.length ? [...extraNews, ...news].slice(0, 24) : news,
            extreme,
            auction,
            pending,
            halt,
            reports,
            earnFired,
            dividends,
            won: eq >= GOAL_EQUITY,
            busted: eq <= 0,
            toast: stepped.news?.extreme ? stepped.news.text : toast,
          });
          return;
        } else if (isAuctionPhaseWalk(clock, auction)) {
          quotes = stepAuctionIep(quotes, auction, ctx);
          const ph = sessionPhase(clock);
          if (ph === "close-input" || ph === "close-random") {
            candles = applyTickCandles(candles, quotes, clock, false, ctx.halted, true);
          }
        }

        const eq = equityOf(cash, positions, quotes);
        set({
          clock,
          quotes,
          candles,
          cash,
          positions,
          fills,
          news: extraNews.length ? [...extraNews, ...news].slice(0, 24) : news,
          auction,
          pending,
          halt,
          reports,
          earnFired,
          dividends,
          won: eq >= GOAL_EQUITY,
          busted: eq <= 0,
          toast,
        });
      },
      place: (side, qty, leverage) => {
        const st = get();
        if (st.won || st.busted) return "模擬已結束";
        if (!Number.isFinite(qty) || qty <= 0) return "請輸入有效股數";
        const inst = BY_SYMBOL[st.selected];
        if (!inst) return "找不到股票";
        if (isHalted(st.halt, st.selected, hkDayKey(st.clock))) {
          return `${inst.name} 停牌，暫停買賣`;
        }
        const q = st.quotes[st.selected]!;
        if (usesHkAuction(inst) && !isContinuous(st.clock)) {
          if (!canEnterAuctionOrders(st.clock)) {
            const ph = sessionPhase(st.clock);
            if (ph === "open-cool") return "冷靜期（09:20–09:30）暫停輸入買賣盤";
            if (ph === "close-random") return "隨機對盤期間暫停輸入買賣盤";
            return "非持續交易時段，未能即時成交";
          }
          set({
            pending: { symbol: st.selected, side, qty, leverage: Math.min(Math.max(1, leverage), inst.maxLeverage) },
            toast: `已掛競價盤，待對盤成交：${inst.name}`,
          });
          return null;
        }
        const price = side === "buy" ? q.ask : q.bid;
        const signed = side === "buy" ? qty : -qty;
        const lev = Math.min(Math.max(1, leverage), inst.maxLeverage);
        let positions = st.positions.map((p) => ({ ...p }));
        let cash = st.cash;
        const idx = positions.findIndex((p) => p.symbol === st.selected);
        const existing = idx >= 0 ? positions[idx]! : null;

        if (existing && Math.sign(existing.qty) !== 0 && Math.sign(existing.qty) !== Math.sign(signed)) {
          const closeQty = Math.min(Math.abs(existing.qty), qty);
          const closeSigned = existing.qty > 0 ? -closeQty : closeQty;
          const instPv = inst.pointValue;
          const exit = closeSigned < 0 ? q.bid : q.ask;
          const pnl = (exit - existing.avgPrice) * (existing.qty > 0 ? closeQty : -closeQty) * instPv;
          const marginRelease =
            (notional(st.selected, closeQty, existing.avgPrice) / existing.leverage);
          cash += marginRelease + pnl;
          const remain = existing.qty + closeSigned;
          if (Math.abs(remain) < 1e-12) positions.splice(idx, 1);
          else positions[idx] = { ...existing, qty: remain };
          const leftover = qty - closeQty;
          const fills = [
            {
              id: `${st.clock}-${Math.random().toString(36).slice(2, 8)}`,
              clock: st.clock,
              symbol: st.selected,
              side,
              qty: closeQty,
              price: exit,
              leverage: existing.leverage,
            },
            ...st.fills,
          ].slice(0, 80);
          if (leftover <= 1e-12) {
            set({ cash, positions, fills });
            return null;
          }
          return get().place(side, leftover, lev);
        }

        const cost = notional(st.selected, qty, price) / lev;
        if (cost > cash + 1e-6) return "現金不足（已計入槓桿保證金）";
        cash -= cost;
        if (existing && existing.leverage === lev) {
          const newQty = existing.qty + signed;
          const newAvg =
            (existing.avgPrice * Math.abs(existing.qty) + price * qty) / Math.abs(newQty);
          positions[idx] = { ...existing, qty: newQty, avgPrice: newAvg };
        } else if (existing) {
          return "請先平倉再改槓桿倍數";
        } else {
          positions.push({
            symbol: st.selected,
            qty: signed,
            avgPrice: price,
            leverage: lev,
          });
        }
        const fills = [
          {
            id: `${st.clock}-${Math.random().toString(36).slice(2, 8)}`,
            clock: st.clock,
            symbol: st.selected,
            side,
            qty,
            price,
            leverage: lev,
          },
          ...st.fills,
        ].slice(0, 80);
        set({ cash, positions, fills });
        return null;
      },
      closeSymbol: (symbol) => {
        const st = get();
        const p = st.positions.find((x) => x.symbol === symbol);
        if (!p) return;
        const inst = BY_SYMBOL[symbol];
        if (inst && isHalted(st.halt, symbol, hkDayKey(st.clock))) {
          set({ toast: `${inst.name} 停牌，暫停平倉` });
          return;
        }
        if (inst && usesHkAuction(inst) && !isContinuous(st.clock)) {
          if (!canEnterAuctionOrders(st.clock)) {
            set({
              toast:
                sessionPhase(st.clock) === "open-cool"
                  ? "冷靜期暫停平倉，待 09:30 開市"
                  : "隨機對盤期間暫停平倉",
            });
            return;
          }
          set({
            pending: {
              symbol,
              side: p.qty > 0 ? "sell" : "buy",
              qty: Math.abs(p.qty),
              leverage: p.leverage,
            },
            toast: `已掛競價平倉盤，待對盤：${inst.name}`,
          });
          return;
        }
        const q = st.quotes[symbol]!;
        if (!inst) return;
        const exit = p.qty > 0 ? q.bid : q.ask;
        const pnl = (exit - p.avgPrice) * p.qty * inst.pointValue;
        const margin = notional(symbol, p.qty, p.avgPrice) / p.leverage;
        const cash = st.cash + margin + pnl;
        const fills = [
          {
            id: `${st.clock}-c${Math.random().toString(36).slice(2, 7)}`,
            clock: st.clock,
            symbol,
            side: (p.qty > 0 ? "sell" : "buy") as Side,
            qty: Math.abs(p.qty),
            price: exit,
            leverage: p.leverage,
          },
          ...st.fills,
        ].slice(0, 80);
        set({
          cash,
          positions: st.positions.filter((x) => x.symbol !== symbol),
          fills,
        });
      },
      reset: () => {
        set(initial());
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem(CANDLE_KEY);
          } catch {
            /* ignore */
          }
        }
      },
    }),
    {
      name: "hk-paper-desk-v2",
      partialize: (s) => ({
        cash: s.cash,
        clock: s.clock,
        quotes: s.quotes,
        histories: s.histories,
        positions: s.positions,
        fills: s.fills,
        news: s.news,
        selected: s.selected,
        won: s.won,
        busted: s.busted,
        extreme: s.extreme,
        auction: s.auction,
        pending: s.pending,
        halt: s.halt,
        reports: s.reports,
        earnFired: s.earnFired,
        dividends: s.dividends,
        speed: 0 as Speed,
      }),
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return localStorage.getItem(name);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          persistBuffer.name = name;
          persistBuffer.value = value;
          if (persistTimer != null) return;
          persistTimer = setTimeout(() => {
            persistTimer = null;
            flushPersist();
            saveCandleBook(useDesk.getState().candles);
          }, 2000);
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            /* ignore */
          }
        },
      })),
    },
  ),
);

if (typeof window !== "undefined") {
  const settleOnLeave = () => {
    flushPersist();
    saveCandleBook(useDesk.getState().candles);
  };
  window.addEventListener("pagehide", settleOnLeave);
  window.addEventListener("beforeunload", settleOnLeave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushPersist();
      saveCandleBook(useDesk.getState().candles);
    }
  });
}

