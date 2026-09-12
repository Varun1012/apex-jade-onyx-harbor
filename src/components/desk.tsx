import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { BY_SYMBOL, GOAL_EQUITY, STARTING_CASH, UNIVERSE } from "@/lib/market/universe";
import { analyze } from "@/lib/market/ta";
import type { Tf } from "@/lib/market/candles";
import { createAmbient, type AmbientHandle } from "@/lib/ambient";
import { equityOf, positionValue, useDesk, type Speed } from "@/lib/store";
import { cn } from "@/lib/utils";

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
    const id = window.setInterval(tick, Math.max(80, 900 / speed));
    return () => window.clearInterval(id);
  }, [tick, speed, won, busted]);
}

export function Desk() {
  useTicker();
  const hydrateHistories = useDesk((s) => s.hydrateHistories);
  useEffect(() => {
    hydrateHistories();
  }, [hydrateHistories]);

  const cash = useDesk((s) => s.cash);
  const quotes = useDesk((s) => s.quotes);
  const positions = useDesk((s) => s.positions);
  const clock = useDesk((s) => s.clock);
  const speed = useDesk((s) => s.speed);
  const setSpeed = useDesk((s) => s.setSpeed);
  const musicOn = useDesk((s) => s.musicOn);
  const setMusicOn = useDesk((s) => s.setMusicOn);
  const selected = useDesk((s) => s.selected);
  const select = useDesk((s) => s.select);
  const won = useDesk((s) => s.won);
  const busted = useDesk((s) => s.busted);
  const reset = useDesk((s) => s.reset);
  const news = useDesk((s) => s.news);
  const fills = useDesk((s) => s.fills);
  const histories = useDesk((s) => s.histories);
  const toast = useDesk((s) => s.toast);
  const clearToast = useDesk((s) => s.clearToast);
  const equity = equityOf(cash, positions, quotes);
  const pnl = equity - STARTING_CASH;
  const hsi = quotes.HSI;
  const hsiChg = hsi ? (hsi.last - hsi.prevClose) / hsi.prevClose : 0;
  const progress = Math.min(1, equity / GOAL_EQUITY);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(clearToast, 3200);
    return () => window.clearTimeout(id);
  }, [toast, clearToast]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
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
          <Stat label="模擬時間" value={formatSimTime(clock)} />
          <Stat
            label="恒生指數"
            value={hsi ? hsi.last.toLocaleString("en-HK") : "—"}
            sub={
              hsi ? (
                <Signed n={hsiChg}>
                  {hsi.last - hsi.prevClose >= 0 ? "+" : "−"}
                  {Math.abs(hsi.last - hsi.prevClose).toFixed(0)} {formatPct(hsiChg)}
                </Signed>
              ) : null
            }
          />
          <Stat label="現金" value={formatHkd(cash)} />
          <Stat
            label="總資產"
            value={formatHkd(equity)}
            sub={
              <Signed n={pnl}>
                {formatHkd(pnl)} · {formatPct(pnl / STARTING_CASH)}
              </Signed>
            }
          />
        </div>
        <div className="mt-4">
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
        </div>
      </header>

      {news[0] ? (
        <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2 text-sm sm:px-6">
          <Badge variant="outline">行情</Badge>
          <p className="min-w-0 truncate text-muted-foreground">{news[0].text}</p>
        </div>
      ) : null}

      <main className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)_minmax(260px,0.85fr)]">
        <section className="order-2 bg-background lg:order-1">
          <Watchlist />
        </section>
        <section className="order-1 bg-background p-4 sm:p-5 lg:order-2">
          <Ticket />
        </section>
        <section className="order-3 bg-background p-4 sm:p-5">
          <Holdings />
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
                      {formatQty(f.qty)} @ {formatPrice(f.price)}
                      {f.leverage > 1 ? ` ×${f.leverage}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      {(won || busted) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground">
              {won ? "MISSION COMPLETE" : "MARGIN CALL"}
            </p>
            <h2 className="mt-1 text-2xl font-medium tracking-tight">
              {won ? "財富自由" : "戶口爆倉"}
            </h2>
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
      )}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-lg">
          {toast}
        </div>
      ) : null}

      <p className="sr-only">已選 {selected}</p>
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
  useEffect(() => {
    if (on) void handle.current?.start().then(() => handle.current?.setMuted(false));
    else handle.current?.setMuted(true);
  }, [on]);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      aria-label={on ? "關閉 Lo-fi" : "開啟 Lo-fi"}
    >
      {on ? <Volume2 /> : <VolumeX />}
      {on ? "Lo-fi 開" : "Lo-fi"}
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
  const quotes = useDesk((s) => s.quotes);
  const selected = useDesk((s) => s.selected);
  const select = useDesk((s) => s.select);
  const histories = useDesk((s) => s.histories);
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const n = q.trim();
    return UNIVERSE.filter(
      (i) => !n || i.symbol.includes(n) || i.name.includes(n) || i.sector.includes(n),
    );
  }, [q]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <h2 className="text-sm font-medium">市場</h2>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋代號 / 名稱"
          className="h-9 max-w-48"
        />
      </div>
      <div className="mt-2 hidden grid-cols-[72px_1fr_88px_72px] px-4 text-[11px] text-muted-foreground sm:grid sm:px-5">
        <span>代號</span>
        <span>名稱</span>
        <span className="text-right">賣 / 買</span>
        <span className="text-right">走勢</span>
      </div>
      <ul className="max-h-[48vh] overflow-auto pb-4 lg:max-h-[70vh]">
        {rows.map((inst) => {
          const qt = quotes[inst.symbol];
          if (!qt) return null;
          const chg = (qt.last - qt.prevClose) / qt.prevClose;
          const hist = histories[inst.symbol] ?? [qt.last];
          const active = selected === inst.symbol;
          return (
            <li key={inst.symbol}>
              <button
                type="button"
                onClick={() => select(inst.symbol)}
                className={cn(
                  "grid w-full grid-cols-[72px_1fr_auto] items-center gap-2 px-4 py-2.5 text-left sm:grid-cols-[72px_1fr_88px_72px] sm:px-5",
                  active ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                <span className="font-mono text-sm tabular-nums">{inst.symbol}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm">{inst.name}</span>
                  <span className="text-[11px] text-muted-foreground">{inst.sector}</span>
                </span>
                <span className="text-right">
                  <span className="block font-mono text-sm tabular-nums">{formatPrice(qt.last)}</span>
                  <Signed n={chg}>
                    <span className="text-[11px]">{formatPct(chg)}</span>
                  </Signed>
                </span>
                <span className="hidden justify-end sm:flex">
                  <Sparkline data={hist} up={chg >= 0} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Ticket() {
  const selected = useDesk((s) => s.selected);
  const quotes = useDesk((s) => s.quotes);
  const candles = useDesk((s) => s.candles);
  const cash = useDesk((s) => s.cash);
  const place = useDesk((s) => s.place);
  const inst = BY_SYMBOL[selected];
  const q = quotes[selected];
  const [qty, setQty] = useState("1");
  const [lev, setLev] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [tf, setTf] = useState<Tf>("15m");

  useEffect(() => {
    setLev(1);
    setErr(null);
    setQty("1");
  }, [selected, inst?.kind]);

  if (!inst || !q) return null;
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  const levClamped = Math.min(lev, inst.maxLeverage);
  const buyNotional = n * q.ask * inst.pointValue;
  const sellNotional = n * q.bid * inst.pointValue;
  const buyMargin = buyNotional / levClamped;
  const series = candles?.[selected]?.[tf] ?? [];
  const chg = (q.last - q.prevClose) / q.prevClose;
  const hints = analyze(series);

  function submit(side: "buy" | "sell") {
    const msg = place(side, n, levClamped);
    setErr(msg);
  }

  const tfs: { id: Tf; label: string }[] = [
    { id: "5m", label: "5分鐘" },
    { id: "15m", label: "15分鐘" },
    { id: "1d", label: "日線" },
  ];

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{inst.symbol}</p>
          <h2 className="text-xl font-medium tracking-tight">{inst.name}</h2>
        </div>
        <Badge variant={inst.kind === "index" ? "outline" : "default"}>
          {inst.kind === "index" ? "指數差價 · 每點 HK$1" : inst.kind === "etf" ? "ETF" : "正股 · 支援碎股"}
        </Badge>
      </div>
      <div className="mt-3 flex items-end gap-4">
        <p className="font-mono text-3xl tabular-nums tracking-tight">{formatPrice(q.last)}</p>
        <Signed n={chg}>
          <span className="text-sm">{formatPct(chg)}</span>
        </Signed>
      </div>
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
      <div className="mt-2">
        <CandleChart candles={series} />
      </div>
      <div className="mt-3 space-y-2 rounded-lg border border-border bg-card p-3">
        <p className="text-[11px] tracking-wide text-muted-foreground">技術走勢提示 · 教學用途，非投資建議</p>
        {hints.map((h) => (
          <div key={h.title}>
            <p className={cn("text-sm font-medium", h.bias === "up" ? "text-up" : h.bias === "down" ? "text-down" : "text-foreground")}>
              {h.title}
            </p>
            <p className="text-[12px] leading-relaxed text-muted-foreground">{h.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-down-soft px-3 py-2">
          <p className="text-[11px] text-down">買入價 Bid（賣出成交）</p>
          <p className="font-mono text-lg tabular-nums text-down">{formatPrice(q.bid)}</p>
        </div>
        <div className="rounded-lg bg-up-soft px-3 py-2">
          <p className="text-[11px] text-up">賣出價 Ask（買入成交）</p>
          <p className="font-mono text-lg tabular-nums text-up">{formatPrice(q.ask)}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        港股慣例：紅升綠跌。買入以賣出價成交，賣出以買入價成交。可沽空。恒指迷你最高十倍槓桿。
      </p>
      <div className="mt-4 grid gap-3">
        <label className="text-xs text-muted-foreground">
          數量{inst.kind === "index" ? "（口）" : "（股）"}
          <Input
            className="mt-1"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))}
          />
        </label>
        <div>
          <p className="text-xs text-muted-foreground">槓桿（最高 {inst.maxLeverage}x）</p>
          <div className="mt-1 flex gap-1">
            {[1, 2, 5, 10].filter((x) => x <= inst.maxLeverage).map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setLev(x)}
                className={cn(
                  "h-11 flex-1 rounded-md border text-sm",
                  levClamped === x
                    ? "border-primary bg-secondary"
                    : "border-border text-muted-foreground",
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
          <Button variant="buy" onClick={() => submit("buy")}>
            買入 @ {formatPrice(q.ask)}
          </Button>
          <Button variant="sell" onClick={() => submit("sell")}>
            賣出 @ {formatPrice(q.bid)}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          賣出名義 {formatHkd(sellNotional)}
          {levClamped > 1 ? ` · 保證金佔名義 1/${levClamped}` : ""}
        </p>
      </div>
    </div>
  );
}

function Holdings() {
  const positions = useDesk((s) => s.positions);
  const quotes = useDesk((s) => s.quotes);
  const closeSymbol = useDesk((s) => s.closeSymbol);
  const select = useDesk((s) => s.select);

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-medium">
        <TrendingUp className="size-4 text-muted-foreground" />
        持倉
      </h2>
      {positions.length === 0 ? (
        <p className="text-sm text-muted-foreground">空倉。本金 {formatHkd(STARTING_CASH, 0)}，目標 {formatHkd(GOAL_EQUITY, 0)}。</p>
      ) : (
        <ul className="space-y-2">
          {positions.map((p) => {
            const inst = BY_SYMBOL[p.symbol]!;
            const q = quotes[p.symbol]!;
            const val = positionValue(p, q);
            const mtm = p.qty > 0 ? q.bid : q.ask;
            const pnl = (mtm - p.avgPrice) * p.qty * inst.pointValue;
            return (
              <li
                key={p.symbol}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="text-left" onClick={() => select(p.symbol)}>
                    <p className="text-sm">
                      {inst.name}{" "}
                      <span className="font-mono text-muted-foreground">{p.symbol}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.qty > 0 ? "好倉" : "淡倉"} {formatQty(Math.abs(p.qty))} · 均價 {formatPrice(p.avgPrice)}
                      {p.leverage > 1 ? ` · ${p.leverage}x` : ""}
                    </p>
                  </button>
                  <button
                    type="button"
                    className="size-11 text-muted-foreground hover:text-foreground"
                    onClick={() => closeSymbol(p.symbol)}
                    aria-label={`平倉 ${inst.name}`}
                  >
                    <X className="mx-auto size-4" />
                  </button>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="font-mono tabular-nums text-muted-foreground">{formatHkd(val)}</span>
                  <Signed n={pnl}>{formatHkd(pnl)}</Signed>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
