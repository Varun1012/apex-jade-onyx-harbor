import { useEffect, useMemo, useRef, useState, memo, type ReactNode } from "react";
import {
  RotateCcw,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CandleChart } from "@/components/candle-chart";
import { Sparkline } from "@/components/sparkline";
import { formatHkd, formatPct, formatPrice, formatQty, formatSimTime } from "@/lib/format";
import { BY_SYMBOL, GOAL_EQUITY, STARTING_CASH, listedInstruments } from "@/lib/market/universe";
import { advise } from "@/lib/market/ta";
import type { Tf } from "@/lib/market/candles";
import { createAmbient, type AmbientHandle } from "@/lib/ambient";
import { equityOf, useDesk, type Speed } from "@/lib/store";
import {
  canEnterAuctionOrders,
  hkDayKey,
  isAuction,
  isContinuous,
  isPreOpenSession,
  sessionLabel,
  sessionPhase,
  usesHkAuction,
} from "@/lib/market/engine";
import { formatDayKey, formatDps, formatYi, haltResumeLabel, isHalted, nextResults } from "@/lib/market/corporate";
import { cn } from "@/lib/utils";

function px(n: number, symbol: string) {
  return formatPrice(n, BY_SYMBOL[symbol]?.kind === "crypto" ? "USD" : "HKD");
}

function defaultQty(symbol: string) {
  return BY_SYMBOL[symbol]?.kind === "crypto" ? "0.01" : "1";
}

function sanitizeQty(raw: string, symbol: string) {
  if (BY_SYMBOL[symbol]?.kind === "crypto") {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const dot = cleaned.indexOf(".");
    if (dot === -1) return cleaned;
    return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "").slice(0, 6);
  }
  return raw.replace(/[^\d]/g, "");
}

function parseQty(raw: string, symbol: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const inst = BY_SYMBOL[symbol];
  if (inst?.kind === "crypto") {
    const step = inst.lot || 0.001;
    return Math.round(n / step) * step;
  }
  return Math.floor(n);
}

function Signed({ n, children }: { n: number; children: ReactNode }) {
  const cls = n > 0 ? "text-up" : n < 0 ? "text-down" : "text-muted-foreground";
  return <span className={cn("tabular-nums", cls)}>{children}</span>;
}

function useTicker() {
  const tick = useDesk((s) => s.tick);
  const speed = useDesk((s) => s.speed);
  const won = useDesk((s) => s.won);
  const busted = useDesk((s) => s.busted);
  useEffect(() => {
    if (speed === 0 || won || busted) return;
    let busy = false;
    const id = window.setInterval(() => {
      if (busy) return;
      busy = true;
      try {
        tick();
      } finally {
        busy = false;
      }
    }, Math.max(80, 900 / speed));
    return () => window.clearInterval(id);
  }, [tick, speed, won, busted]);
}

export function Desk() {
  useTicker();
  const hydrateHistories = useDesk((s) => s.hydrateHistories);
  useEffect(() => {
    hydrateHistories();
  }, [hydrateHistories]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <HeaderBar />
      <NewsStrip />
      <main className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)_minmax(260px,0.85fr)]">
        <section className="order-2 bg-background lg:order-1">
          <WatchlistMemo />
        </section>
        <section className="order-1 bg-background p-4 sm:p-5 lg:order-2">
          <Ticket />
        </section>
        <section className="order-3 bg-background p-4 sm:p-5">
          <Holdings />
          <Fills />
        </section>
      </main>
      <EndOverlay />
      <Toast />
    </div>
  );
}

function HeaderBar() {
  const speed = useDesk((s) => s.speed);
  const setSpeed = useDesk((s) => s.setSpeed);
  const musicOn = useDesk((s) => s.musicOn);
  const setMusicOn = useDesk((s) => s.setMusicOn);
  const won = useDesk((s) => s.won);
  const busted = useDesk((s) => s.busted);
  const reset = useDesk((s) => s.reset);

  return (
    <header className="border-b border-border px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            PAPER HANG SENG
          </p>
          <h1 className="font-medium text-xl tracking-tight">港股模擬盤</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SpeedControl speed={speed} onChange={setSpeed} disabled={won || busted} />
          <MusicToggle on={musicOn} onChange={setMusicOn} />
          <Button variant="outline" size="sm" onClick={reset} aria-label="重開戶口">
            <RotateCcw />
            重開戶口
          </Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ClockStat />
        <HsiStat />
        <CashStat />
        <EquityStat />
      </div>
      <div className="mt-4">
        <GoalBar />
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          交易時段：星期一至五。開市競價 09:00–09:20 輸入買賣盤、09:20–09:30 冷靜期；持續交易 09:30–12:00／13:00–16:00；收市競價 16:00–16:10（約 8–10 分鐘後隨機對盤）。競價只可掛對盤、當刻不成交，故陰陽燭之間可出現缺口。午休 12:00–13:00 停市。
        </p>
      </div>
    </header>
  );
}

function ClockStat() {
  const clock = useDesk((s) => s.clock);
  return <Stat label="模擬時間" value={formatSimTime(clock)} sub={<span>{sessionLabel(clock)}</span>} />;
}

function HsiStat() {
  const last = useDesk((s) => s.quotes.HSI?.last);
  const prev = useDesk((s) => s.quotes.HSI?.prevClose);
  const hsiChg = last && prev ? (last - prev) / prev : 0;
  return (
    <Stat
      label="恒生指數"
      value={last ? last.toLocaleString("en-HK") : "—"}
      sub={
        last && prev ? (
          <Signed n={hsiChg}>
            {last - prev >= 0 ? "+" : "−"}
            {Math.abs(last - prev).toFixed(0)} {formatPct(hsiChg)}
          </Signed>
        ) : null
      }
    />
  );
}

function CashStat() {
  const cash = useDesk((s) => s.cash);
  return <Stat label="現金" value={formatHkd(cash)} />;
}

function EquityStat() {
  const cash = useDesk((s) => s.cash);
  const positions = useDesk((s) => s.positions);
  const quotes = useDesk((s) => s.quotes);
  const equity = equityOf(cash, positions, quotes);
  const pnl = equity - STARTING_CASH;
  return (
    <Stat
      label="總資產"
      value={formatHkd(equity)}
      sub={
        <Signed n={pnl}>
          {formatHkd(pnl)} · {formatPct(pnl / STARTING_CASH)}
        </Signed>
      }
    />
  );
}

function GoalBar() {
  const cash = useDesk((s) => s.cash);
  const positions = useDesk((s) => s.positions);
  const quotes = useDesk((s) => s.quotes);
  const equity = equityOf(cash, positions, quotes);
  const progress = Math.min(1, equity / GOAL_EQUITY);
  return (
    <>
      <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>任務：由 {formatHkd(STARTING_CASH, 0)} 做到財富自由</span>
        <span className="tabular-nums">{formatHkd(GOAL_EQUITY, 0)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-[var(--motion-fast)]"
          style={{ width: `${Math.max(1.2, progress * 100)}%` }}
        />
      </div>
    </>
  );
}

function NewsStrip() {
  const news = useDesk((s) => s.news[0]);
  if (!news) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b px-4 py-2 text-sm sm:px-6",
        news.extreme
          ? news.sign === 1
            ? "border-up/40 bg-up-soft"
            : "border-down/40 bg-down-soft"
          : "border-border bg-surface",
      )}
    >
      <Badge variant="outline">{news.extreme ? (news.sign === 1 ? "暴升" : "暴跌") : "行情"}</Badge>
      <p
        className={cn(
          "min-w-0 truncate",
          news.extreme ? (news.sign === 1 ? "text-up" : "text-down") : "text-muted-foreground",
        )}
      >
        {news.text}
      </p>
    </div>
  );
}

function Fills() {
  const fills = useDesk((s) => s.fills);
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-medium">成交紀錄</h2>
      {fills.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚未落盤。買入以賣出價成交，賣出以買入價成交。</p>
      ) : (
        <ul className="max-h-56 space-y-2 overflow-auto text-sm">
          {fills.slice(0, 12).map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2">
              <span className={f.side === "buy" ? "text-up" : "text-down"}>
                {f.side === "buy" ? "買入" : "賣出"} {f.symbol}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatQty(f.qty)} @ {px(f.price, f.symbol)}
                {f.leverage > 1 ? ` ×${f.leverage}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EndOverlay() {
  const won = useDesk((s) => s.won);
  const busted = useDesk((s) => s.busted);
  const cash = useDesk((s) => s.cash);
  const positions = useDesk((s) => s.positions);
  const quotes = useDesk((s) => s.quotes);
  const reset = useDesk((s) => s.reset);
  if (!won && !busted) return null;
  const equity = equityOf(cash, positions, quotes);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground">
          {won ? "MISSION COMPLETE" : "MARGIN CALL"}
        </p>
        <h2 className="mt-1 text-2xl font-medium tracking-tight">{won ? "財富自由" : "戶口爆倉"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {won
            ? "總資產已達港幣一億。你可以重開戶口，再以一萬本金挑戰一次。"
            : "保證金已耗盡，持倉被強制平倉。重開戶口後本金重置為港幣一萬。"}
        </p>
        <p className="mt-3 font-mono text-lg tabular-nums">{formatHkd(equity)}</p>
        <Button className="mt-5 w-full" onClick={reset}>
          再來一局
        </Button>
      </div>
    </div>
  );
}

function Toast() {
  const toast = useDesk((s) => s.toast);
  const clearToast = useDesk((s) => s.clearToast);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(clearToast, 3200);
    return () => window.clearTimeout(id);
  }, [toast, clearToast]);
  if (!toast) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-lg">
      {toast}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-mono text-base tabular-nums tracking-tight sm:text-lg">{value}</p>
      {sub ? <div className="text-xs">{sub}</div> : null}
    </div>
  );
}

function MusicToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const handle = useRef<AmbientHandle | null>(null);
  useEffect(() => {
    handle.current = createAmbient();
    return () => handle.current?.stop();
  }, []);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        const next = !on;
        if (next) void handle.current?.start();
        else handle.current?.setMuted(true);
        onChange(next);
      }}
      aria-pressed={on}
      aria-label={on ? "關閉行情音樂" : "開啟行情音樂"}
    >
      {on ? <Volume2 /> : <VolumeX />}
      {on ? "行情 開" : "行情"}
    </Button>
  );
}

function SpeedControl({
  speed,
  onChange,
  disabled,
}: {
  speed: Speed;
  onChange: (s: Speed) => void;
  disabled?: boolean;
}) {
  const opts: { s: Speed; label: string }[] = [
    { s: 0, label: "暫停" },
    { s: 1, label: "1x" },
    { s: 4, label: "4x" },
    { s: 12, label: "12x" },
  ];
  return (
    <div className="flex rounded-md border border-border p-0.5">
      {opts.map((o) => (
        <button
          key={o.s}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.s)}
          className={cn(
            "h-9 min-w-11 rounded-sm px-2.5 text-xs",
            speed === o.s ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Watchlist() {
  const [q, setQ] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const rows = useMemo(() => {
    const n = q.trim();
    return listedInstruments().filter(
      (i) => !n || i.symbol.includes(n) || i.name.includes(n) || i.sector.includes(n),
    );
  }, [q]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <h2 className="text-sm font-medium">市場</h2>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋代號 / 名稱"
          className="h-9 max-w-48"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div className="mt-2 hidden grid-cols-[72px_1fr_104px_72px] px-4 text-[11px] text-muted-foreground sm:grid sm:px-5">
        <span>代號</span>
        <span>名稱</span>
        <span className="text-right">賣 / 買</span>
        <span className="text-right">走勢</span>
      </div>
      <ul
        ref={listRef}
        data-watchlist="market"
        className="max-h-[48vh] overflow-auto overscroll-contain pb-4 [overflow-anchor:none] lg:max-h-[70vh]"
      >
        {rows.map((inst) => (
          <WatchRow key={inst.symbol} symbol={inst.symbol} name={inst.name} sector={inst.sector} />
        ))}
      </ul>
    </div>
  );
}

const WatchlistMemo = memo(Watchlist);

const WatchRow = memo(function WatchRow({
  symbol,
  name,
  sector,
}: {
  symbol: string;
  name: string;
  sector: string;
}) {
  const qt = useDesk((s) => s.quotes[symbol]);
  const selected = useDesk((s) => s.selected === symbol);
  const hist = useDesk((s) => s.histories[symbol]);
  const halted = useDesk((s) => isHalted(s.halt, symbol, hkDayKey(s.clock), s.clock));
  const select = useDesk((s) => s.select);
  if (!qt) return null;
  const chg = (qt.last - qt.prevClose) / qt.prevClose;
  const spark = hist ?? [qt.last];
  return (
    <li>
      <button
        type="button"
        onClick={() => select(symbol)}
        className={cn(
          "grid w-full grid-cols-[72px_1fr_auto] items-center gap-2 px-4 py-2.5 text-left sm:grid-cols-[72px_1fr_104px_72px] sm:px-5",
          selected ? "bg-secondary" : "hover:bg-secondary/60",
        )}
      >
        <span className="font-mono text-sm tabular-nums">{symbol}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm">{name}</span>
          <span className="text-[11px] text-muted-foreground">
            {halted ? "停牌" : sector}
          </span>
        </span>
        <span className="text-right">
          <span className="block font-mono text-sm tabular-nums">{px(qt.last, symbol)}</span>
          <Signed n={chg}>
            <span className="text-[11px]">{formatPct(chg)}</span>
          </Signed>
        </span>
        <span className="hidden justify-end sm:flex">
          <Sparkline data={spark} up={chg >= 0} />
        </span>
      </button>
    </li>
  );
});

function Ticket() {
  const selected = useDesk((s) => s.selected);
  const inst = BY_SYMBOL[selected];
  const [tf, setTf] = useState<Tf>("15m");

  if (!inst) return null;

  const tfs: { id: Tf; label: string }[] = [
    { id: "5m", label: "5分鐘" },
    { id: "15m", label: "15分鐘" },
    { id: "1d", label: "日線" },
  ];

  return (
    <div>
      <TicketHead symbol={selected} />
      <div className="mt-3 flex rounded-md border border-border p-0.5">
        {tfs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTf(t.id)}
            className={cn(
              "h-9 flex-1 rounded-sm text-xs",
              tf === t.id ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CandleOhlc symbol={selected} tf={tf} />
      <div className="mt-2">
        <CandleChart symbol={selected} tf={tf} />
      </div>
      <BidAsk symbol={selected} />
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        港股慣例：紅升綠跌。持續交易時買入以賣出價成交、賣出以買入價成交。競價時段只可掛對盤，對盤前不成交，開／收市價相對前收可出現缺口。
      </p>
      <OrderTicket symbol={selected} />
      <FinReport symbol={selected} />
      <Hints symbol={selected} tf={tf} />
    </div>
  );
}

function TicketHead({ symbol }: { symbol: string }) {
  const inst = BY_SYMBOL[symbol]!;
  const last = useDesk((s) => s.quotes[symbol]?.last);
  const prev = useDesk((s) => s.quotes[symbol]?.prevClose);
  const iep = useDesk((s) => s.quotes[symbol]?.iep);
  const clock = useDesk((s) => s.clock);
  const halted = useDesk((s) => isHalted(s.halt, symbol, hkDayKey(s.clock), s.clock));
  if (last == null || prev == null) return null;
  const chg = (last - prev) / prev;
  const auction = isAuction(clock) && usesHkAuction(inst);
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{inst.symbol}</p>
          <h2 className="text-xl font-medium tracking-tight">{inst.name}</h2>
        </div>
        <Badge variant={halted ? "outline" : inst.kind === "index" ? "outline" : "default"}>
          {halted
            ? "停牌"
            : inst.kind === "index"
            ? "指數差價 · 每點 HK$1"
            : inst.kind === "etf"
              ? "ETF"
              : inst.kind === "crypto"
                ? "加密貨幣 · USD · 約 7.8 兌港元"
                : "正股 · 支援碎股"}
        </Badge>
      </div>
      <div className="mt-3 flex items-end gap-4">
        <p className="font-mono text-3xl tabular-nums tracking-tight">{px(last, symbol)}</p>
        <Signed n={chg}>
          <span className="text-sm">{formatPct(chg)}</span>
        </Signed>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground" data-prev-close>
        收市 {px(prev, symbol)}
        {auction && iep ? ` · 對盤 ${px(iep, symbol)}` : ""}
        {halted ? " · 停牌" : ""}
      </p>
    </>
  );
}

function CandleOhlc({ symbol, tf }: { symbol: string; tf: Tf }) {
  const live = useDesk((s) => s.quotes[symbol]?.last);
  const clock = useDesk((s) => s.clock);
  const bar = useDesk((s) => {
    const list = s.candles[symbol]?.[tf];
    return list?.[list.length - 1] ?? null;
  });
  if (!bar || live == null) return null;
  const freeze = isPreOpenSession(clock);
  const o = bar.o;
  const h = freeze ? bar.h : Math.max(bar.h, live);
  const l = freeze ? bar.l : Math.min(bar.l, live);
  const c = freeze ? bar.c : live;
  const cell = (lab: string, v: number, id?: string) => (
    <div>
      <p className="text-[11px] text-muted-foreground">{lab}</p>
      <p className="font-mono text-sm tabular-nums" data-ohlc-part={id}>
        {px(v, symbol)}
      </p>
    </div>
  );
  return (
    <div className="mt-2 grid grid-cols-4 gap-2" data-ohlc={`${o},${h},${l},${c}`}>
      {cell("開", o, "o")}
      {cell("高", h, "h")}
      {cell("低", l, "l")}
      {cell("收", c, "c")}
    </div>
  );
}

function Hints({ symbol, tf }: { symbol: string; tf: Tf }) {
  const live = useDesk((s) => s.quotes[symbol]?.last);
  const barT = useDesk((s) => s.candles[symbol]?.[tf]?.at(-1)?.t ?? 0);
  const len = useDesk((s) => s.candles[symbol]?.[tf]?.length ?? 0);
  const lastVol = useDesk((s) => s.candles[symbol]?.[tf]?.at(-1)?.v ?? 0);
  const pos = useDesk((s) => s.positions.find((p) => p.symbol === symbol) ?? null);
  const bid = useDesk((s) => s.quotes[symbol]?.bid);
  const ask = useDesk((s) => s.quotes[symbol]?.ask);
  const ccy = BY_SYMBOL[symbol]?.kind === "crypto" ? "USD" : "HKD";
  const freeze = useDesk((s) => isPreOpenSession(s.clock));
  const advice = useMemo(() => {
    const series = useDesk.getState().candles[symbol]?.[tf] ?? [];
    return advise(series, freeze ? undefined : live, ccy);
  }, [symbol, tf, live, barT, len, lastVol, ccy, freeze]);
  const stableHints = useMemo(() => {
    const series = useDesk.getState().candles[symbol]?.[tf] ?? [];
    return advise(series, undefined, ccy).hints.slice(0, 3);
  }, [symbol, tf, barT, len, ccy]);

  let posR: number | null = null;
  let posPnl: number | null = null;
  if (pos && bid != null && ask != null) {
    const inst = BY_SYMBOL[symbol]!;
    const mtm = pos.qty > 0 ? bid : ask;
    posPnl = (mtm - pos.avgPrice) * pos.qty * inst.pointValue;
    if (advice.atr) {
      const risk = Math.abs(pos.qty) * advice.atr * inst.pointValue;
      posR = risk > 1e-9 ? posPnl / risk : null;
    }
  }

  const longBetter =
    advice.longRR != null && advice.shortRR != null && advice.longRR >= advice.shortRR;

  return (
    <div className="mt-3 min-h-[168px] space-y-2 rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] tracking-wide text-muted-foreground">
        實時盈虧比 · 技術提示 · 教學用途，非投資建議
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className={cn("rounded-md px-2.5 py-2", longBetter ? "bg-up-soft" : "bg-secondary")}>
          <p className="text-[11px] text-muted-foreground">偏多盈虧比</p>
          <p className={cn("font-mono text-lg tabular-nums", longBetter ? "text-up" : "text-foreground")}>
            {advice.longRR != null ? `${advice.longRR.toFixed(1)} : 1` : "—"}
          </p>
          {advice.resist != null ? (
            <p className="text-[11px] text-muted-foreground">目標 {px(advice.resist, symbol)}</p>
          ) : null}
        </div>
        <div className={cn("rounded-md px-2.5 py-2", !longBetter ? "bg-down-soft" : "bg-secondary")}>
          <p className="text-[11px] text-muted-foreground">偏空盈虧比</p>
          <p className={cn("font-mono text-lg tabular-nums", !longBetter ? "text-down" : "text-foreground")}>
            {advice.shortRR != null ? `${advice.shortRR.toFixed(1)} : 1` : "—"}
          </p>
          {advice.support != null ? (
            <p className="text-[11px] text-muted-foreground">目標 {px(advice.support, symbol)}</p>
          ) : null}
        </div>
      </div>
      {pos && posPnl != null ? (
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">持倉盈虧額</p>
          <p className="font-mono text-base tabular-nums" data-live-pnl-hint>
            <Signed n={posPnl}>
              {formatHkd(posPnl)}
              {posR != null ? ` · ${posR >= 0 ? "+" : "−"}${Math.abs(posR).toFixed(1)}R` : ""}
            </Signed>
          </p>
        </div>
      ) : null}
      {stableHints.map((h) => (
        <div key={h.title}>
          <p
            className={cn(
              "text-sm font-medium",
              h.bias === "up" ? "text-up" : h.bias === "down" ? "text-down" : "text-foreground",
            )}
          >
            {h.title}
          </p>
          <p className="text-[12px] leading-relaxed text-muted-foreground">{h.body}</p>
        </div>
      ))}
    </div>
  );
}

function FinReport({ symbol }: { symbol: string }) {
  const inst = BY_SYMBOL[symbol];
  const clock = useDesk((s) => s.clock);
  const report = useDesk((s) => s.reports?.[symbol]);
  const halt = useDesk((s) => s.halt);
  const div = useDesk((s) => s.dividends?.[symbol]);
  if (!inst || inst.kind !== "stock") return null;
  const next = nextResults(symbol, clock);
  const halted = isHalted(halt, symbol, hkDayKey(clock), clock);
  return (
    <div className="mt-3 rounded-lg border border-border bg-card p-3" data-fin-report>
      <p className="text-[11px] tracking-wide text-muted-foreground">個股財報 · 每季公布一次</p>
      {halted && halt ? (
        <p className="mt-1 text-sm text-up">
          停牌至 {haltResumeLabel(halt)} · {halt.reason}
          {halt.announce ? <span className="mt-1 block text-muted-foreground">{halt.announce}</span> : null}
        </p>
      ) : null}
      {report ? (
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-[11px] text-muted-foreground">最近 {report.period}</p>
            <p className="tabular-nums">營業額 {formatYi(report.revenue)}</p>
            <p className="tabular-nums">純利 {formatYi(report.profit)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">按年 / 預期</p>
            <p className="tabular-nums">
              {report.yoy >= 0 ? "+" : "−"}
              {Math.abs(report.yoy * 100).toFixed(1)}%
            </p>
            <p className="tabular-nums text-muted-foreground">
              {report.surprise >= 0 ? "勝" : "遜"}預期 {Math.abs(report.surprise * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">尚無已公布業績。</p>
      )}
      {div && div.dps > 0 ? (
        <div className="mt-2 rounded-md bg-secondary/70 px-2.5 py-2 text-sm" data-div>
          <p>
            派息 每股 {formatDps(div.dps)}
            {div.paid ? " · 已派發" : div.exed ? " · 已除淨" : ""}
          </p>
          <p className="text-[11px] text-muted-foreground">
            除淨日 {formatDayKey(div.exKey)} · 派息日 {formatDayKey(div.payKey)}
          </p>
        </div>
      ) : report && report.profit > 0 ? (
        <p className="mt-2 text-[11px] text-muted-foreground">有純利，本期尚未／不派息</p>
      ) : (
        <p className="mt-2 text-[11px] text-muted-foreground">無純利則不考慮派息</p>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        下次公布 {formatDayKey(next.dayKey)} · {next.period}
      </p>
    </div>
  );
}

function BidAsk({ symbol }: { symbol: string }) {
  const bid = useDesk((s) => s.quotes[symbol]?.bid);
  const ask = useDesk((s) => s.quotes[symbol]?.ask);
  const iep = useDesk((s) => s.quotes[symbol]?.iep);
  const clock = useDesk((s) => s.clock);
  const inst = BY_SYMBOL[symbol];
  if (bid == null || ask == null) return null;
  const auction = !!(inst && usesHkAuction(inst) && isAuction(clock));
  const pxIep = iep ?? lastOr(bid, ask);
  if (auction) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-secondary/60 px-3 py-2">
        <p className="text-[11px] text-muted-foreground">競價對盤價 IEP（掛盤待對盤，即時不成交）</p>
        <p className="font-mono text-lg tabular-nums">{px(pxIep, symbol)}</p>
        <p className="text-[11px] text-muted-foreground">{sessionLabel(clock)}</p>
      </div>
    );
  }
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
      <div className="rounded-lg bg-down-soft px-3 py-2">
        <p className="text-[11px] text-down">買入價 Bid（賣出成交）</p>
        <p className="font-mono text-lg tabular-nums text-down">{px(bid, symbol)}</p>
      </div>
      <div className="rounded-lg bg-up-soft px-3 py-2">
        <p className="text-[11px] text-up">賣出價 Ask（買入成交）</p>
        <p className="font-mono text-lg tabular-nums text-up">{px(ask, symbol)}</p>
      </div>
    </div>
  );
}

function lastOr(a: number, b: number) {
  return (a + b) / 2;
}

const QtyField = memo(function QtyField({
  resetKey,
  qtyRef,
  onTyped,
}: {
  resetKey: string;
  qtyRef: { current: string };
  onTyped: (v: string) => void;
}) {
  const start = defaultQty(resetKey);
  const [qty, setQty] = useState(start);
  useEffect(() => {
    const next = defaultQty(resetKey);
    setQty(next);
    qtyRef.current = next;
    onTyped(next);
  }, [resetKey, qtyRef, onTyped]);
  const crypto = BY_SYMBOL[resetKey]?.kind === "crypto";
  return (
    <Input
      className="mt-1"
      inputMode={crypto ? "decimal" : "numeric"}
      value={qty}
      autoComplete="off"
      spellCheck={false}
      onChange={(e) => {
        const v = sanitizeQty(e.target.value, resetKey);
        setQty(v);
        qtyRef.current = v;
        onTyped(v);
      }}
    />
  );
});

function OrderTicket({ symbol }: { symbol: string }) {
  const inst = BY_SYMBOL[symbol]!;
  const place = useDesk((s) => s.place);
  const cash = useDesk((s) => s.cash);
  const ask = useDesk((s) => s.quotes[symbol]?.ask);
  const bid = useDesk((s) => s.quotes[symbol]?.bid);
  const iep = useDesk((s) => s.quotes[symbol]?.iep);
  const clock = useDesk((s) => s.clock);
  const pending = useDesk((s) => s.pending);
  const halted = useDesk((s) => isHalted(s.halt, symbol, hkDayKey(s.clock), s.clock));
  const qtyRef = useRef(defaultQty(symbol));
  const [qtyView, setQtyView] = useState(defaultQty(symbol));
  const [lev, setLev] = useState(1);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLev(1);
    setErr(null);
    const next = defaultQty(symbol);
    qtyRef.current = next;
    setQtyView(next);
  }, [symbol, inst.kind]);

  if (ask == null || bid == null) return null;
  const n = parseQty(qtyView, symbol);
  const levClamped = Math.min(lev, inst.maxLeverage);
  const auction = usesHkAuction(inst) && isAuction(clock);
  const pxTrade = auction ? iep ?? ask : ask;
  const pxSell = auction ? iep ?? bid : bid;
  const buyNotional = n * pxTrade * inst.pointValue;
  const sellNotional = n * pxSell * inst.pointValue;
  const buyMargin = buyNotional / levClamped;
  const canSubmit = (!auction || canEnterAuctionOrders(clock)) && !halted;
  const phase = sessionPhase(clock);

  function submit(side: "buy" | "sell") {
    const qty = parseQty(qtyRef.current, symbol);
    const msg = place(side, qty, levClamped);
    setErr(msg);
  }

  return (
    <div className="mt-4 grid gap-3">
      {pending ? (
        <p className="rounded-md bg-secondary px-3 py-2 text-[12px] text-muted-foreground">
          已掛競價盤：{pending.side === "buy" ? "買入" : "賣出"} {pending.symbol}，待對盤成交。
        </p>
      ) : null}
      <label className="text-xs text-muted-foreground">
        數量{inst.kind === "index" ? "（口）" : inst.kind === "crypto" ? "（BTC）" : "（股）"}
        <QtyField resetKey={symbol} qtyRef={qtyRef} onTyped={setQtyView} />
      </label>
      <div>
        <p className="text-xs text-muted-foreground">槓桿（最高 {inst.maxLeverage}x）</p>
        <div className="mt-1 flex gap-1">
          {[1, 2, 5, 10]
            .filter((x) => x <= inst.maxLeverage)
            .map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setLev(x)}
                className={cn(
                  "h-11 flex-1 rounded-md border text-sm",
                  levClamped === x ? "border-primary bg-secondary" : "border-border text-muted-foreground",
                )}
              >
                {x}x
              </button>
            ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>買入保證金 {formatHkd(buyMargin)}</span>
        <span>可用現金 {formatHkd(cash)}</span>
      </div>
      {err ? <p className="text-sm text-up">{err}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="buy" onClick={() => submit("buy")} disabled={!canSubmit}>
          {halted ? "停牌" : auction ? `對盤買入 @ ${px(pxTrade, symbol)}` : `買入 @ ${px(ask, symbol)}`}
        </Button>
        <Button variant="sell" onClick={() => submit("sell")} disabled={!canSubmit}>
          {halted ? "停牌" : auction ? `對盤賣出 @ ${px(pxSell, symbol)}` : `賣出 @ ${px(bid, symbol)}`}
        </Button>
      </div>
      {halted ? (
        <p className="text-[11px] text-muted-foreground">停牌期間暫停買賣，持倉凍結至復牌。</p>
      ) : !canSubmit && auction ? (
        <p className="text-[11px] text-muted-foreground">
          {phase === "open-cool" ? "冷靜期暫停輸入買賣盤，09:30 開市後可即時成交。" : "隨機對盤期間暫停輸入買賣盤。"}
        </p>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        賣出名義 {formatHkd(sellNotional)}
        {levClamped > 1 ? ` · 保證金佔名義 1/${levClamped}` : ""}
        {inst.kind === "crypto" ? " · 報價美元、按約 7.8 兌港元入帳" : ""}
      </p>
    </div>
  );
}

function Holdings() {
  const positions = useDesk((s) => s.positions);

  return (
    <div>
      <h2 className="mb-2 flex items-center justify-between gap-2 text-sm font-medium">
        <span className="flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          持倉
        </span>
        {positions.length > 0 ? <HoldingsTotalPnl /> : null}
      </h2>
      {positions.length === 0 ? (
        <p className="text-sm text-muted-foreground">空倉。本金 {formatHkd(STARTING_CASH, 0)}，目標 {formatHkd(GOAL_EQUITY, 0)}。</p>
      ) : (
        <ul className="space-y-2">
          {positions.map((p) => (
            <HoldingRow
              key={p.symbol}
              symbol={p.symbol}
              qty={p.qty}
              avgPrice={p.avgPrice}
              leverage={p.leverage}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function HoldingsTotalPnl() {
  const positions = useDesk((s) => s.positions);
  const quotes = useDesk((s) => s.quotes);
  const total = positions.reduce((sum, p) => {
    const q = quotes[p.symbol];
    if (!q) return sum;
    const inst = BY_SYMBOL[p.symbol]!;
    const mtm = p.qty > 0 ? q.bid : q.ask;
    return sum + (mtm - p.avgPrice) * p.qty * inst.pointValue;
  }, 0);
  return (
    <Signed n={total}>
      <span className="font-mono text-sm tabular-nums" data-live-pnl-total>
        {formatHkd(total)}
      </span>
    </Signed>
  );
}

const HoldingRow = memo(function HoldingRow({
  symbol,
  qty,
  avgPrice,
  leverage,
}: {
  symbol: string;
  qty: number;
  avgPrice: number;
  leverage: number;
}) {
  const bid = useDesk((s) => s.quotes[symbol]?.bid);
  const ask = useDesk((s) => s.quotes[symbol]?.ask);
  const closeSymbol = useDesk((s) => s.closeSymbol);
  const select = useDesk((s) => s.select);
  const inst = BY_SYMBOL[symbol];
  if (!inst || bid == null || ask == null) return null;
  const mtm = qty > 0 ? bid : ask;
  const pnl = (mtm - avgPrice) * qty * inst.pointValue;
  const margin = (Math.abs(qty) * avgPrice * inst.pointValue) / leverage;
  const val = margin + pnl;
  const pct = avgPrice ? ((mtm - avgPrice) / avgPrice) * (qty > 0 ? 1 : -1) : 0;

  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <button type="button" className="text-left" onClick={() => select(symbol)}>
          <p className="text-sm">
            {inst.name}{" "}
            <span className="font-mono text-muted-foreground">{symbol}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            {qty > 0 ? "好倉" : "淡倉"} {formatQty(Math.abs(qty))} · 均價 {px(avgPrice, symbol)}
            {leverage > 1 ? ` · ${leverage}x` : ""} · 市價 {px(mtm, symbol)}
          </p>
        </button>
        <button
          type="button"
          className="size-11 text-muted-foreground hover:text-foreground"
          onClick={() => closeSymbol(symbol)}
          aria-label={`平倉 ${inst.name}`}
        >
          <X className="mx-auto size-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[11px] text-muted-foreground">盈虧額</p>
          <p className="font-mono text-lg tabular-nums tracking-tight" data-live-pnl={symbol}>
            <Signed n={pnl}>{formatHkd(pnl)}</Signed>
          </p>
          <p className="text-[11px]">
            <Signed n={pct}>{formatPct(pct)}</Signed>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">持倉市值</p>
          <p className="font-mono text-sm tabular-nums text-muted-foreground">{formatHkd(val)}</p>
        </div>
      </div>
    </li>
  );
});
