import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GOAL_EQUITY,
  STARTING_CASH,
  UNIVERSE,
  BY_SYMBOL,
} from "./market/universe";
import {
  applyTickCandles,
  ensureCandles,
  seedCandles,
  type CandleBook,
} from "./market/candles";
import {
  advanceClock,
  isSession,
  nextMarketOpen,
  rollDay,
  seedQuotes,
  stepMarket,
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
  const d = new Date("2026-09-14T01:30:00Z");
  return d.getTime();
}

function seedHistories(quotes: Record<string, Quote>): Record<string, number[]> {
  const h: Record<string, number[]> = {};
  for (const inst of UNIVERSE) h[inst.symbol] = [quotes[inst.symbol]!.last];
  return h;
}

function mergeQuotes(existing: Record<string, Quote>): Record<string, Quote> {
  const seeded = seedQuotes();
  const out = { ...seeded, ...existing };
  for (const inst of UNIVERSE) {
    if (!out[inst.symbol]) out[inst.symbol] = seeded[inst.symbol]!;
  }
  return out;
}

function initial() {
  const quotes = seedQuotes();
  const clock = seedClock();
  return {
    cash: STARTING_CASH,
    clock,
    quotes,
    histories: seedHistories(quotes),
    candles: seedCandles(quotes, clock),
    positions: [] as Position[],
    fills: [] as Fill[],
    news: [] as NewsItem[],
    speed: 1 as Speed,
    selected: "0700",
    won: false,
    busted: false,
    toast: null as string | null,
    musicOn: false,
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

export const useDesk = create<DeskState>()(
  persist(
    (set, get) => ({
      ...initial(),
      hydrateHistories: () => {
        const st = get();
        const quotes = mergeQuotes(st.quotes);
        const candles = ensureCandles(st.candles, quotes, st.clock);
        const histories =
          Object.keys(st.histories).length >= UNIVERSE.length
            ? st.histories
            : seedHistories(quotes);
        set({ quotes, candles, histories });
      },
      select: (symbol) => set({ selected: symbol }),
      setSpeed: (s) => set({ speed: s }),
      setMusicOn: (on) => set({ musicOn: on }),
      clearToast: () => set({ toast: null }),
      tick: () => {
        const st = get();
        if (st.won || st.busted || st.speed === 0) return;
        let clock = advanceClock(st.clock, 1);
        let quotes = mergeQuotes(st.quotes);
        const hk = (() => {
          const d = new Date(clock);
          return new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Hong_Kong",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).formatToParts(d);
        })();
        const hour = Number(hk.find((x) => x.type === "hour")?.value);
        const minute = Number(hk.find((x) => x.type === "minute")?.value);
        if (hour === 9 && minute === 30) {
          quotes = rollDay(quotes);
        }
        if (!isSession(clock)) clock = nextMarketOpen(clock);
        const stepped = stepMarket(quotes, st.histories, clock);
        let cash = st.cash;
        let positions = st.positions.map((p) => ({ ...p }));
        const liquidated: string[] = [];
        positions = positions.filter((p) => {
          const q = stepped.quotes[p.symbol]!;
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
        const eq = equityOf(cash, positions, stepped.quotes);
        const news = stepped.news
          ? [stepped.news, ...st.news].slice(0, 24)
          : st.news;
        set({
          clock,
          quotes: stepped.quotes,
          histories: stepped.histories,
          candles: applyTickCandles(st.candles ?? seedCandles(stepped.quotes, clock), stepped.quotes, clock),
          cash,
          positions,
          news,
          won: eq >= GOAL_EQUITY,
          busted: eq <= 0,
          toast: liquidated.length
            ? `${liquidated.map((s) => BY_SYMBOL[s]?.name ?? s).join("、")} 已強制平倉`
            : st.toast,
        });
      },
      place: (side, qty, leverage) => {
        const st = get();
        if (st.won || st.busted) return "模擬已結束";
        if (!Number.isFinite(qty) || qty <= 0) return "請輸入有效股數";
        const inst = BY_SYMBOL[st.selected];
        if (!inst) return "找不到股票";
        const q = st.quotes[st.selected]!;
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
          if (remain === 0) positions.splice(idx, 1);
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
          if (leftover <= 0) {
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
        const q = st.quotes[symbol]!;
        const inst = BY_SYMBOL[symbol]!;
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
      reset: () => set(initial()),
    }),
    {
      name: "hk-paper-desk-v2",
      partialize: (s) => ({
        cash: s.cash,
        clock: s.clock,
        quotes: s.quotes,
        positions: s.positions,
        fills: s.fills,
        news: s.news,
        selected: s.selected,
        won: s.won,
        busted: s.busted,
        speed: 0 as Speed,
      }),
    },
  ),
);

