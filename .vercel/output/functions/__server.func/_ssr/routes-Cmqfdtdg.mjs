import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as TrendingUp, n as VolumeX, o as RotateCcw, r as Volume2, t as X } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Cmqfdtdg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var badgeVariants = cva("inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium tracking-wide", {
	variants: { variant: {
		default: "bg-secondary text-muted-foreground",
		up: "bg-up-soft text-up",
		down: "bg-down-soft text-down",
		outline: "border border-border text-muted-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({
			variant,
			className
		})),
		...props
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[opacity,transform,background-color,color] duration-[var(--motion-quick)] ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90",
			secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
			outline: "border border-border bg-transparent hover:bg-secondary",
			ghost: "hover:bg-secondary",
			buy: "bg-up text-up-foreground hover:opacity-90",
			sell: "bg-down text-down-foreground hover:opacity-90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("flex h-11 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground tabular-nums shadow-none outline-none transition-[border-color,box-shadow] duration-[var(--motion-quick)] placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
}
var HK = "Asia/Hong_Kong";
function hkParts(ms) {
	const map = {};
	for (const p of new Intl.DateTimeFormat("en-US", {
		timeZone: HK,
		weekday: "short",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}).formatToParts(new Date(ms))) if (p.type !== "literal") map[p.type] = p.value;
	const weekday = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6
	}[map.weekday ?? "Mon"] ?? 1;
	return {
		year: Number(map.year),
		month: Number(map.month),
		day: Number(map.day),
		hour: Number(map.hour),
		minute: Number(map.minute),
		weekday
	};
}
function pad(n) {
	return String(n).padStart(2, "0");
}
function hkDate(y, m, d, h, min) {
	return Date.parse(`${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:00+08:00`);
}
function formatHkd(n, digits = 2) {
	const abs = Math.abs(n);
	const sign = n < 0 ? "−" : "";
	if (abs >= 1e9) return `${sign}HK$${(abs / 1e9).toFixed(2)}B`;
	if (abs >= 1e7) return `${sign}HK$${(abs / 1e6).toFixed(2)}M`;
	return `${sign}HK$${abs.toLocaleString("en-HK", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	})}`;
}
function formatQty(n) {
	return n.toLocaleString("en-HK");
}
function formatPrice(n) {
	if (n >= 1e3) return n.toFixed(1);
	if (n >= 100) return n.toFixed(2);
	if (n >= 10) return n.toFixed(2);
	if (n >= 1) return n.toFixed(3);
	return n.toFixed(3);
}
function formatPct(n) {
	return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n * 100).toFixed(2)}%`;
}
function formatSimTime(ms) {
	const p = hkParts(ms);
	return `週${[
		"日",
		"一",
		"二",
		"三",
		"四",
		"五",
		"六"
	][p.weekday]} ${pad(p.hour)}:${pad(p.minute)}`;
}
function sma$1(values, n) {
	return values.map((_, i) => {
		if (i + 1 < n) return null;
		return values.slice(i + 1 - n, i + 1).reduce((a, b) => a + b, 0) / n;
	});
}
function CandleChart({ candles }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const parent = canvas.parentElement;
		if (!parent) return;
		const draw = () => {
			const dpr = window.devicePixelRatio || 1;
			const w = parent.clientWidth;
			const h = 220;
			canvas.width = Math.max(1, Math.floor(w * dpr));
			canvas.height = Math.floor(h * dpr);
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, w, h);
			const padL = 52;
			const padR = 8;
			const padT = 10;
			const data = candles.slice(-72);
			if (!data.length) return;
			const highs = data.map((c) => c.h);
			const lows = data.map((c) => c.l);
			let min = Math.min(...lows);
			let max = Math.max(...highs);
			if (min === max) {
				min *= .99;
				max *= 1.01;
			}
			const span = max - min;
			min -= span * .08;
			max += span * .08;
			const plotW = w - padL - padR;
			const plotH = 202;
			const y = (v) => padT + (max - v) / (max - min) * plotH;
			const slot = plotW / data.length;
			const bodyW = Math.max(2, Math.min(9, slot * .62));
			const styles = getComputedStyle(document.documentElement);
			const up = styles.getPropertyValue("--color-up").trim() || "#c4453c";
			const down = styles.getPropertyValue("--color-down").trim() || "#2f8f6b";
			const muted = styles.getPropertyValue("--color-muted").trim() || "#8b9188";
			const border = styles.getPropertyValue("--color-border").trim() || "#2a2d29";
			const fg = styles.getPropertyValue("--color-fg").trim() || "#ecece8";
			ctx.strokeStyle = border;
			ctx.lineWidth = 1;
			ctx.font = "10px IBM Plex Mono, ui-monospace, monospace";
			ctx.fillStyle = muted;
			ctx.textAlign = "right";
			for (let i = 0; i < 4; i++) {
				const v = max - (max - min) * i / 3;
				const yy = y(v);
				ctx.beginPath();
				ctx.moveTo(padL, yy);
				ctx.lineTo(w - padR, yy);
				ctx.stroke();
				ctx.fillText(formatPrice(v), 46, yy + 3);
			}
			data.forEach((c, i) => {
				const x = padL + slot * i + slot / 2;
				const color = c.c >= c.o ? up : down;
				ctx.strokeStyle = color;
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.moveTo(x, y(c.h));
				ctx.lineTo(x, y(c.l));
				ctx.stroke();
				const top = y(Math.max(c.o, c.c));
				const bot = y(Math.min(c.o, c.c));
				const bh = Math.max(1, bot - top);
				ctx.fillRect(x - bodyW / 2, top, bodyW, bh);
			});
			const ma = sma$1(data.map((c) => c.c), Math.min(20, data.length));
			ctx.beginPath();
			ctx.strokeStyle = fg;
			ctx.globalAlpha = .45;
			ctx.lineWidth = 1.2;
			let started = false;
			ma.forEach((v, i) => {
				if (v == null) return;
				const x = padL + slot * i + slot / 2;
				if (!started) {
					ctx.moveTo(x, y(v));
					started = true;
				} else ctx.lineTo(x, y(v));
			});
			ctx.stroke();
			ctx.globalAlpha = 1;
		};
		draw();
		const ro = new ResizeObserver(draw);
		ro.observe(parent);
		return () => ro.disconnect();
	}, [candles]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref,
			className: "block w-full",
			"aria-label": "陰陽燭圖"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-[11px] text-muted-foreground",
			children: "淡色線為 20 期簡單平均（SMA20）。紅升綠跌。"
		})]
	});
}
function Sparkline({ data, up, className }) {
	const w = 72;
	const h = 24;
	if (!data.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: w,
		height: h,
		className
	});
	const min = Math.min(...data);
	const span = Math.max(...data) - min || 1;
	const pts = data.map((v, i) => {
		const x = i / Math.max(data.length - 1, 1) * w;
		const y = 22 - (v - min) / span * 20;
		return `${x.toFixed(1)},${y.toFixed(1)}`;
	}).join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: w,
		height: h,
		viewBox: `0 0 ${w} ${h}`,
		className,
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
			fill: "none",
			stroke: up ? "var(--color-up)" : "var(--color-down)",
			strokeWidth: "1.4",
			points: pts
		})
	});
}
var STARTING_CASH = 1e4;
var GOAL_EQUITY = 1e8;
var UNIVERSE = [
	{
		symbol: "HSI",
		name: "恒生指數迷你",
		kind: "index",
		sector: "指數",
		start: 25842,
		vol: .012,
		beta: 1,
		lot: 1,
		weight: 0,
		pointValue: 1,
		maxLeverage: 10
	},
	{
		symbol: "2800",
		name: "盈富基金",
		kind: "etf",
		sector: "指數",
		start: 25.84,
		vol: .01,
		beta: 1,
		lot: 100,
		weight: 0,
		pointValue: 1,
		maxLeverage: 1
	},
	{
		symbol: "0005",
		name: "匯豐控股",
		kind: "stock",
		sector: "金融",
		start: 88.45,
		vol: .011,
		beta: .85,
		lot: 400,
		weight: .09,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "0700",
		name: "騰訊控股",
		kind: "stock",
		sector: "科技",
		start: 412.6,
		vol: .018,
		beta: 1.25,
		lot: 100,
		weight: .11,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "9988",
		name: "阿里巴巴",
		kind: "stock",
		sector: "科技",
		start: 92.15,
		vol: .02,
		beta: 1.3,
		lot: 100,
		weight: .07,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "3690",
		name: "美團",
		kind: "stock",
		sector: "科技",
		start: 118.3,
		vol: .024,
		beta: 1.35,
		lot: 100,
		weight: .05,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "1810",
		name: "小米集團",
		kind: "stock",
		sector: "科技",
		start: 48.75,
		vol: .026,
		beta: 1.4,
		lot: 200,
		weight: .045,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "0941",
		name: "中國移動",
		kind: "stock",
		sector: "電訊",
		start: 76.2,
		vol: .009,
		beta: .55,
		lot: 500,
		weight: .07,
		pointValue: 1,
		maxLeverage: 2
	},
	{
		symbol: "1299",
		name: "友邦保險",
		kind: "stock",
		sector: "金融",
		start: 68.9,
		vol: .013,
		beta: .9,
		lot: 200,
		weight: .08,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "0388",
		name: "港交所",
		kind: "stock",
		sector: "金融",
		start: 352.4,
		vol: .016,
		beta: 1.1,
		lot: 100,
		weight: .06,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "2318",
		name: "中國平安",
		kind: "stock",
		sector: "金融",
		start: 47.85,
		vol: .017,
		beta: 1.05,
		lot: 500,
		weight: .05,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "1211",
		name: "比亞迪股份",
		kind: "stock",
		sector: "汽車",
		start: 268,
		vol: .022,
		beta: 1.2,
		lot: 50,
		weight: .04,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "9618",
		name: "京東集團",
		kind: "stock",
		sector: "科技",
		start: 128.5,
		vol: .023,
		beta: 1.28,
		lot: 50,
		weight: .03,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "9999",
		name: "網易",
		kind: "stock",
		sector: "科技",
		start: 154.8,
		vol: .019,
		beta: 1.15,
		lot: 100,
		weight: .025,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "0001",
		name: "長和",
		kind: "stock",
		sector: "地產",
		start: 46.2,
		vol: .012,
		beta: .7,
		lot: 500,
		weight: .03,
		pointValue: 1,
		maxLeverage: 2
	},
	{
		symbol: "0002",
		name: "中電控股",
		kind: "stock",
		sector: "公用",
		start: 64.75,
		vol: .007,
		beta: .35,
		lot: 500,
		weight: .025,
		pointValue: 1,
		maxLeverage: 2
	},
	{
		symbol: "0011",
		name: "恒生銀行",
		kind: "stock",
		sector: "金融",
		start: 108.3,
		vol: .01,
		beta: .65,
		lot: 100,
		weight: .03,
		pointValue: 1,
		maxLeverage: 2
	},
	{
		symbol: "0175",
		name: "吉利汽車",
		kind: "stock",
		sector: "汽車",
		start: 16.42,
		vol: .025,
		beta: 1.22,
		lot: 500,
		weight: .02,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "2020",
		name: "安踏體育",
		kind: "stock",
		sector: "消費",
		start: 86.5,
		vol: .018,
		beta: .95,
		lot: 200,
		weight: .02,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "2382",
		name: "舜宇光學",
		kind: "stock",
		sector: "科技",
		start: 62.8,
		vol: .028,
		beta: 1.32,
		lot: 100,
		weight: .015,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "1024",
		name: "快手",
		kind: "stock",
		sector: "科技",
		start: 52.4,
		vol: .03,
		beta: 1.45,
		lot: 100,
		weight: .02,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "9961",
		name: "攜程集團",
		kind: "stock",
		sector: "消費",
		start: 478,
		vol: .021,
		beta: 1.18,
		lot: 50,
		weight: .02,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "9888",
		name: "百度集團",
		kind: "stock",
		sector: "科技",
		start: 91.2,
		vol: .022,
		beta: 1.2,
		lot: 50,
		weight: .02,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "0434",
		name: "博雅互動",
		kind: "stock",
		sector: "科技",
		start: 5.18,
		vol: .038,
		beta: 1.15,
		lot: 400,
		weight: 0,
		pointValue: 1,
		maxLeverage: 5
	},
	{
		symbol: "3988",
		name: "中國銀行",
		kind: "stock",
		sector: "金融",
		start: 4.21,
		vol: .01,
		beta: .72,
		lot: 1e3,
		weight: .04,
		pointValue: 1,
		maxLeverage: 2
	}
];
var BY_SYMBOL = Object.fromEntries(UNIVERSE.map((i) => [i.symbol, i]));
function tickSize(price) {
	if (price < .25) return .001;
	if (price < .5) return .005;
	if (price < 10) return .01;
	if (price < 20) return .02;
	if (price < 50) return .05;
	if (price < 100) return .1;
	if (price < 200) return .2;
	if (price < 500) return .5;
	if (price < 1e3) return 1;
	if (price < 2e3) return 2;
	if (price < 5e3) return 5;
	return 10;
}
function roundTick(price) {
	const t = tickSize(price);
	return Math.max(t, Math.round(price / t) * t);
}
var NEWS_POOL = [
	{
		text: "北水持續淨流入，港股氣氛轉旺",
		bias: .45
	},
	{
		text: "聯儲局官員放鴿，資金重新追逐風險資產",
		bias: .55
	},
	{
		text: "內地公布消費補貼細節，零售與互聯網受捧",
		bias: .4,
		focus: "3690"
	},
	{
		text: "騰訊遊戲版號獲批，科技股急彈",
		bias: .7,
		focus: "0700"
	},
	{
		text: "阿里雲簽下大型企業合約，電商板塊跟漲",
		bias: .5,
		focus: "9988"
	},
	{
		text: "小米新機預售超預期，硬件股活躍",
		bias: .6,
		focus: "1810"
	},
	{
		text: "港交所成交額創月內新高",
		bias: .35,
		focus: "0388"
	},
	{
		text: "匯豐上調亞洲業務指引",
		bias: .4,
		focus: "0005"
	},
	{
		text: "友邦新業務價值勝預期",
		bias: .35,
		focus: "1299"
	},
	{
		text: "比亞迪海外銷量再創新高",
		bias: .5,
		focus: "1211"
	},
	{
		text: "地緣風險升溫，資金湧入防守股",
		bias: -.35
	},
	{
		text: "港元拆息抽升，金融股受壓",
		bias: -.4,
		focus: "0005"
	},
	{
		text: "監管傳聞再起，科網股高位回吐",
		bias: -.55
	},
	{
		text: "美團即時零售競爭加劇，市場憂慮利潤率",
		bias: -.45,
		focus: "3690"
	},
	{
		text: "內地樓市數據遜預期，地產相關受挫",
		bias: -.4,
		focus: "0001"
	},
	{
		text: "油價急升推高通脹預期，風險胃納下降",
		bias: -.3
	},
	{
		text: "快手廣告收入指引保守",
		bias: -.4,
		focus: "1024"
	},
	{
		text: "舜宇光學大客戶訂單下修",
		bias: -.5,
		focus: "2382"
	},
	{
		text: "中國移動派息政策維持進取",
		bias: .25,
		focus: "0941"
	},
	{
		text: "攜程暑假預訂數據強勁",
		bias: .45,
		focus: "9961"
	},
	{
		text: "博雅互動海外棋牌流水回升，股份交投轉旺",
		bias: .55,
		focus: "0434"
	},
	{
		text: "中國銀行息差穩定，派息率維持進取",
		bias: .3,
		focus: "3988"
	}
];
function sma(values, n) {
	if (values.length < n) return null;
	return values.slice(-n).reduce((a, b) => a + b, 0) / n;
}
function rsi(closes, n = 14) {
	if (closes.length < n + 1) return null;
	let gain = 0;
	let loss = 0;
	for (let i = closes.length - n; i < closes.length; i++) {
		const d = closes[i] - closes[i - 1];
		if (d >= 0) gain += d;
		else loss -= d;
	}
	if (loss === 0) return 100;
	return 100 - 100 / (1 + gain / loss);
}
function ema(values, n) {
	if (values.length < n) return null;
	const k = 2 / (n + 1);
	let e = values.slice(0, n).reduce((a, b) => a + b, 0) / n;
	for (let i = n; i < values.length; i++) e = values[i] * k + e * (1 - k);
	return e;
}
function lastPattern(cs) {
	if (cs.length < 2) return null;
	const a = cs[cs.length - 2];
	const b = cs[cs.length - 1];
	const body = Math.abs(b.c - b.o);
	const range = b.h - b.l || 1e-9;
	const lower = Math.min(b.o, b.c) - b.l;
	const upper = b.h - Math.max(b.o, b.c);
	const up = b.c >= b.o;
	if (body / range < .12) return {
		title: "十字星（Doji）",
		body: "實體很短，多空暫時平衡。若出現在急升或急跌之後，常見於轉向觀察點，需等下一根確認。",
		bias: "neutral"
	};
	if (lower > body * 2 && upper < body * .6 && up) return {
		title: "錘頭（Hammer）",
		body: "長下影線顯示低位有買盤承接。教學上多視為潛在止跌訊號，但仍要配合均線與成交位置。",
		bias: "up"
	};
	if (upper > body * 2 && lower < body * .6 && !up) return {
		title: "上吊／射擊之星",
		body: "長上影線代表高位賣壓。若緊貼阻力或均線，傾向視為回吐警號。",
		bias: "down"
	};
	const aUp = a.c >= a.o;
	if (!aUp && up && b.o <= a.c && b.c >= a.o) return {
		title: "陽包陰（底部吞噬）",
		body: "陽燭實體覆蓋前一根陰燭，屬常見短線轉強形態。確認方法：收市站上近 20 期均線更有力。",
		bias: "up"
	};
	if (aUp && !up && b.o >= a.c && b.c <= a.o) return {
		title: "陰包陽（頂部吞噬）",
		body: "陰燭覆蓋前陽，顯示賣盤轉強。教學上視作短線轉弱，勿單靠一根燭下結論。",
		bias: "down"
	};
	return null;
}
function analyze(candles) {
	const cs = candles.slice(-80);
	if (cs.length < 5) return [{
		title: "數據不足",
		body: "陰陽燭仍在累積，稍後即可判斷。",
		bias: "neutral"
	}];
	const closes = cs.map((c) => c.c);
	const last = closes[closes.length - 1];
	const ma20 = sma(closes, Math.min(20, closes.length));
	const ma60 = sma(closes, Math.min(60, closes.length));
	const r = rsi(closes);
	const e12 = ema(closes, 12);
	const e26 = ema(closes, 26);
	const hints = [];
	if (ma20 != null) {
		if (last > ma20 * 1.004) hints.push({
			title: "價格在 20 期均線之上",
			body: `現價高於 SMA20（${ma20.toFixed(2)}）。短線結構偏多，回踩均線而守住可視作承接。`,
			bias: "up"
		});
		else if (last < ma20 * .996) hints.push({
			title: "價格在 20 期均線之下",
			body: `現價低於 SMA20（${ma20.toFixed(2)}）。短線結構偏空，反彈至均線或遇阻力。`,
			bias: "down"
		});
		else hints.push({
			title: "貼近 20 期均線",
			body: "價格與均線糾纏，方向未明。宜等陽燭站穩或陰燭跌破再作判斷。",
			bias: "neutral"
		});
	}
	if (ma20 != null && ma60 != null && cs.length >= 40) {
		if (ma20 > ma60) hints.push({
			title: "均線排列偏多",
			body: "短期均線在長期均線之上（金叉結構）。趨勢跟隨者通常只在回調時考慮偏多。",
			bias: "up"
		});
		else hints.push({
			title: "均線排列偏空",
			body: "短期均線在長期均線之下（死叉結構）。反彈未升破均線前，教學上仍當弱勢。",
			bias: "down"
		});
	}
	if (r != null) {
		if (r >= 70) hints.push({
			title: `RSI ${r.toFixed(0)} · 超買區`,
			body: "相對強弱指數偏高，並不等於立刻要沽，只表示升勢可能過熱，宜防回吐。",
			bias: "down"
		});
		else if (r <= 30) hints.push({
			title: `RSI ${r.toFixed(0)} · 超賣區`,
			body: "指數偏低，跌勢或過急。超賣可維持，需等陽燭或 RSI 轉上才作轉強觀察。",
			bias: "up"
		});
		else hints.push({
			title: `RSI ${r.toFixed(0)} · 中性`,
			body: "動能未極端。可把 RSI 當作輔助，主看陰陽燭與均線位置。",
			bias: "neutral"
		});
	}
	if (e12 != null && e26 != null) {
		const macd = e12 - e26;
		hints.push({
			title: macd >= 0 ? "MACD 柱在零軸之上" : "MACD 柱在零軸之下",
			body: macd >= 0 ? "12／26 指數平均差為正，中期動能偏多。" : "平均差為負，中期動能偏空。零軸附近反覆屬盤整。",
			bias: macd >= 0 ? "up" : "down"
		});
	}
	const recent = cs.slice(-5);
	const higherHigh = recent.every((c, i) => i === 0 || c.h >= recent[i - 1].h);
	const lowerLow = recent.every((c, i) => i === 0 || c.l <= recent[i - 1].l);
	if (higherHigh) hints.push({
		title: "近 5 根創更高高位",
		body: "上升波動結構仍在。跌破最近一根低位才視為結構轉弱。",
		bias: "up"
	});
	else if (lowerLow) hints.push({
		title: "近 5 根創更低低位",
		body: "下跌波動結構仍在。要轉強需先止住低位並收復前高。",
		bias: "down"
	});
	const pat = lastPattern(cs);
	if (pat) hints.unshift(pat);
	return hints.slice(0, 4);
}
var BEAT = 60 / 78;
function noiseBuffer(ctx, seconds, color) {
	const len = Math.floor(ctx.sampleRate * seconds);
	const buf = ctx.createBuffer(1, len, ctx.sampleRate);
	const d = buf.getChannelData(0);
	let b0 = 0;
	for (let i = 0; i < len; i++) {
		const w = Math.random() * 2 - 1;
		if (color === "pink") {
			b0 = .97 * b0 + .03 * w;
			d[i] = b0 * 3.2;
		} else d[i] = w;
	}
	return buf;
}
function envGain(ctx, dest, t, peak, a, d) {
	const g = ctx.createGain();
	g.gain.setValueAtTime(1e-4, t);
	g.gain.exponentialRampToValueAtTime(Math.max(2e-4, peak), t + a);
	g.gain.exponentialRampToValueAtTime(1e-4, t + a + d);
	g.connect(dest);
	return g;
}
function kick(ctx, dest, t) {
	const osc = ctx.createOscillator();
	osc.type = "sine";
	osc.frequency.setValueAtTime(140, t);
	osc.frequency.exponentialRampToValueAtTime(42, t + .14);
	const g = envGain(ctx, dest, t, .22, .004, .22);
	osc.connect(g);
	osc.start(t);
	osc.stop(t + .28);
}
function snare(ctx, dest, t, noise) {
	const src = ctx.createBufferSource();
	src.buffer = noise;
	const bp = ctx.createBiquadFilter();
	bp.type = "bandpass";
	bp.frequency.value = 1800;
	bp.Q.value = .8;
	const g = envGain(ctx, dest, t, .11, .003, .12);
	src.connect(bp);
	bp.connect(g);
	const tone = ctx.createOscillator();
	tone.type = "triangle";
	tone.frequency.value = 180;
	const tg = envGain(ctx, dest, t, .04, .002, .08);
	tone.connect(tg);
	src.start(t);
	src.stop(t + .16);
	tone.start(t);
	tone.stop(t + .14);
}
function hat(ctx, dest, t, noise, open) {
	const src = ctx.createBufferSource();
	src.buffer = noise;
	const hp = ctx.createBiquadFilter();
	hp.type = "highpass";
	hp.frequency.value = 7e3;
	const g = envGain(ctx, dest, t, open ? .045 : .028, .001, open ? .18 : .04);
	src.connect(hp);
	hp.connect(g);
	src.start(t);
	src.stop(t + (open ? .2 : .06));
}
function rhodes(ctx, dest, t, freq, dur, peak) {
	const car = ctx.createOscillator();
	const mod = ctx.createOscillator();
	const modG = ctx.createGain();
	car.type = "sine";
	mod.type = "sine";
	car.frequency.value = freq;
	mod.frequency.value = freq * 2;
	modG.gain.value = freq * 1.4;
	mod.connect(modG);
	modG.connect(car.frequency);
	const lp = ctx.createBiquadFilter();
	lp.type = "lowpass";
	lp.frequency.value = 1400;
	const g = envGain(ctx, dest, t, peak, .02, dur);
	car.connect(lp);
	lp.connect(g);
	car.start(t);
	mod.start(t);
	car.stop(t + dur + .05);
	mod.stop(t + dur + .05);
}
function bass(ctx, dest, t, freq) {
	const osc = ctx.createOscillator();
	osc.type = "triangle";
	osc.frequency.value = freq;
	const lp = ctx.createBiquadFilter();
	lp.type = "lowpass";
	lp.frequency.value = 280;
	const g = envGain(ctx, dest, t, .16, .01, .38);
	osc.connect(lp);
	lp.connect(g);
	osc.start(t);
	osc.stop(t + .45);
}
var CHORDS = [
	[
		220,
		261.63,
		329.63,
		392
	],
	[
		146.83,
		174.61,
		220,
		293.66
	],
	[
		196,
		246.94,
		293.66,
		349.23
	],
	[
		130.81,
		164.81,
		196,
		246.94
	]
];
var ROOTS = [
	110,
	146.83,
	98,
	130.81
];
function createAmbient() {
	let ctx = null;
	let master = null;
	let vinyl = null;
	let timer = 0;
	let nextBeat = 0;
	let beatIndex = 0;
	let white = null;
	let wow = null;
	function scheduleBar() {
		const ac = ctx;
		const bus = master;
		const nbuf = white;
		if (!ac || !bus || !nbuf) return;
		const look = .35;
		while (nextBeat < ac.currentTime + look) {
			const t = nextBeat;
			const i = beatIndex % 16;
			const chord = CHORDS[Math.floor(beatIndex / 16) % CHORDS.length];
			const root = ROOTS[Math.floor(beatIndex / 16) % ROOTS.length];
			const swing = i % 2 === 1 ? BEAT * .16 : 0;
			if (i % 4 === 0) kick(ac, bus, t);
			if (i % 4 === 2) snare(ac, bus, t, nbuf);
			hat(ac, bus, t + swing, nbuf, i % 8 === 7);
			if (i % 4 === 0) {
				chord.forEach((f, n) => rhodes(ac, bus, t, f, 1.55, n === 0 ? .05 : .038));
				bass(ac, bus, t, root / 2);
			}
			if (i % 16 === 6) rhodes(ac, bus, t + swing, chord[2] * 2, .55, .03);
			if (i % 16 === 10) rhodes(ac, bus, t + swing, chord[1] * 2, .4, .024);
			nextBeat += BEAT;
			beatIndex += 1;
		}
	}
	async function start() {
		if (ctx) {
			if (ctx.state === "suspended") await ctx.resume();
			return;
		}
		ctx = new (window.AudioContext || window.webkitAudioContext)();
		master = ctx.createGain();
		master.gain.value = .2;
		const filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 1650;
		filter.Q.value = .4;
		wow = ctx.createOscillator();
		const wowG = ctx.createGain();
		wow.type = "sine";
		wow.frequency.value = .12;
		wowG.gain.value = 90;
		wow.connect(wowG);
		wowG.connect(filter.frequency);
		wow.start();
		master.connect(filter);
		filter.connect(ctx.destination);
		if (ctx.state === "suspended") await ctx.resume();
		white = noiseBuffer(ctx, 1.2, "white");
		const pink = noiseBuffer(ctx, 3, "pink");
		vinyl = ctx.createBufferSource();
		vinyl.buffer = pink;
		vinyl.loop = true;
		const vHp = ctx.createBiquadFilter();
		vHp.type = "highpass";
		vHp.frequency.value = 800;
		const vLp = ctx.createBiquadFilter();
		vLp.type = "lowpass";
		vLp.frequency.value = 4200;
		const vG = ctx.createGain();
		vG.gain.value = .035;
		vinyl.connect(vHp);
		vHp.connect(vLp);
		vLp.connect(vG);
		vG.connect(master);
		vinyl.start();
		beatIndex = 0;
		nextBeat = ctx.currentTime + .05;
		scheduleBar();
		timer = window.setInterval(scheduleBar, 80);
	}
	function stop() {
		window.clearInterval(timer);
		timer = 0;
		try {
			vinyl?.stop();
			wow?.stop();
		} catch {}
		vinyl = null;
		wow = null;
		white = null;
		ctx?.close();
		ctx = null;
		master = null;
	}
	function setMuted(muted) {
		if (!master || !ctx) return;
		master.gain.cancelScheduledValues(ctx.currentTime);
		master.gain.linearRampToValueAtTime(muted ? 0 : .2, ctx.currentTime + .25);
	}
	return {
		start,
		stop,
		setMuted
	};
}
var CAP = {
	"5m": 96,
	"15m": 80,
	"1d": 90
};
function hashStr(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	return h >>> 0;
}
function rng(seed) {
	let s = seed >>> 0;
	return () => {
		s = s + 1831565813 >>> 0;
		let t = Math.imul(s ^ s >>> 15, 1 | s);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function gauss$1(rand) {
	let u = 0;
	let v = 0;
	while (u === 0) u = rand();
	while (v === 0) v = rand();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function px(inst, n) {
	return inst.kind === "index" ? Math.round(n) : roundTick(n);
}
function bar(inst, t, close, vol, rand) {
	const range = Math.max(close * vol * (.35 + rand() * .7), close * .002);
	const o = px(inst, close + (rand() - .5) * range);
	const c = px(inst, close);
	return {
		t,
		o,
		h: px(inst, Math.max(o, c) + rand() * range * .6),
		l: px(inst, Math.max(.01, Math.min(o, c) - rand() * range * .6)),
		c
	};
}
function bucketStart(clock, tf) {
	const p = hkParts(clock);
	if (tf === "1d") return hkDate(p.year, p.month, p.day, 9, 30);
	const step = tf === "5m" ? 5 : 15;
	const m = Math.floor(p.minute / step) * step;
	return hkDate(p.year, p.month, p.day, p.hour, m);
}
function walkCloses(inst, last, n, rand) {
	const out = [last];
	let p = last;
	for (let i = 1; i < n; i++) {
		p = Math.max(last * .45, p * (1 + gauss$1(rand) * inst.vol * .55));
		out.push(px(inst, p));
	}
	return out.reverse();
}
function seedSymbol(inst, last, clock) {
	const rand = rng(hashStr(inst.symbol + String(Math.round(last * 100))));
	const dailyCloses = walkCloses(inst, last, 70, rand);
	const daily = dailyCloses.map((c, i) => {
		let t = clock - (dailyCloses.length - 1 - i) * 864e5;
		const hp = hkParts(t);
		t = hkDate(hp.year, hp.month, hp.day, 16, 0);
		return bar(inst, t, c, inst.vol, rand);
	});
	daily[daily.length - 1] = {
		...daily[daily.length - 1],
		c: last,
		h: Math.max(daily[daily.length - 1].h, last),
		l: Math.min(daily[daily.length - 1].l, last)
	};
	const m15closes = walkCloses(inst, last, 64, rand);
	const m15 = m15closes.map((c, i) => {
		return bar(inst, clock - (m15closes.length - 1 - i) * 15 * 6e4, c, inst.vol * .45, rand);
	});
	const m5closes = walkCloses(inst, last, 78, rand);
	return {
		"1d": daily,
		"15m": m15,
		"5m": m5closes.map((c, i) => {
			return bar(inst, clock - (m5closes.length - 1 - i) * 5 * 6e4, c, inst.vol * .3, rand);
		})
	};
}
function seedCandles(quotes, clock) {
	const book = {};
	for (const inst of UNIVERSE) {
		const last = quotes[inst.symbol]?.last ?? inst.start;
		book[inst.symbol] = seedSymbol(inst, last, clock);
	}
	return book;
}
function pushTick(list, next, cap) {
	if (!list.length) return [next];
	const last = list[list.length - 1];
	if (last.t === next.t) {
		const merged = {
			t: last.t,
			o: last.o,
			h: Math.max(last.h, next.h),
			l: Math.min(last.l, next.l),
			c: next.c
		};
		return list.slice(0, -1).concat(merged);
	}
	const out = list.concat(next);
	return out.length > cap ? out.slice(-cap) : out;
}
function applyTickCandles(book, quotes, clock) {
	const next = { ...book };
	for (const inst of UNIVERSE) {
		const q = quotes[inst.symbol];
		if (!q) continue;
		const c = q.last;
		const prev = book[inst.symbol] ?? seedSymbol(inst, c, clock);
		const frames = {
			"5m": prev["5m"] ?? [],
			"15m": prev["15m"] ?? [],
			"1d": prev["1d"] ?? []
		};
		Object.keys(frames).forEach((tf) => {
			const t = bucketStart(clock, tf);
			frames[tf] = pushTick(frames[tf], {
				t,
				o: c,
				h: c,
				l: c,
				c
			}, CAP[tf]);
		});
		next[inst.symbol] = frames;
	}
	return next;
}
function ensureCandles(book, quotes, clock) {
	if (!book || Object.keys(book).length < UNIVERSE.length) {
		const seeded = seedCandles(quotes, clock);
		if (!book) return seeded;
		for (const inst of UNIVERSE) if (!book[inst.symbol]) book[inst.symbol] = seeded[inst.symbol];
		return book;
	}
	return book;
}
function gauss() {
	let u = 0;
	let v = 0;
	while (u === 0) u = Math.random();
	while (v === 0) v = Math.random();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function spreadTicks(inst, last) {
	if (inst.kind === "index") return 2;
	if (inst.kind === "etf") return 1;
	if (last >= 200) return 2;
	return 1;
}
function applySpread(inst, last) {
	const t = inst.kind === "index" ? 1 : tickSize(last);
	const s = spreadTicks(inst, last);
	const lastR = inst.kind === "index" ? Math.round(last) : roundTick(last);
	const bid = lastR - t * s;
	const ask = lastR + t * s;
	return {
		last: lastR,
		bid: Math.max(t, bid),
		ask
	};
}
function seedQuotes() {
	const out = {};
	for (const inst of UNIVERSE) {
		const sp = applySpread(inst, inst.start);
		out[inst.symbol] = {
			...sp,
			open: sp.last,
			high: sp.last,
			low: sp.last,
			prevClose: sp.last
		};
	}
	return out;
}
function nextMarketOpen(from) {
	const p = hkParts(from);
	const mins = p.hour * 60 + p.minute;
	if (p.weekday >= 1 && p.weekday <= 5 && mins < 570) return hkDate(p.year, p.month, p.day, 9, 30);
	let t = hkDate(p.year, p.month, p.day, 9, 30) + 864e5;
	for (let i = 0; i < 8; i++) {
		const q = hkParts(t);
		if (q.weekday >= 1 && q.weekday <= 5) return hkDate(q.year, q.month, q.day, 9, 30);
		t += 864e5;
	}
	return t;
}
function isSession(t) {
	const p = hkParts(t);
	if (p.weekday === 0 || p.weekday === 6) return false;
	const mins = p.hour * 60 + p.minute;
	return mins >= 570 && mins < 720 || mins >= 780 && mins < 960;
}
function advanceClock(t, minutes) {
	let cur = t;
	let left = minutes;
	while (left > 0) {
		cur += 6e4;
		const p = hkParts(cur);
		const mins = p.hour * 60 + p.minute;
		if (mins === 720) cur = hkDate(p.year, p.month, p.day, 13, 0);
		else if (mins >= 960 || p.weekday === 0 || p.weekday === 6) cur = nextMarketOpen(cur);
		left -= 1;
	}
	return cur;
}
function stepMarket(quotes, histories, clock) {
	const shock = gauss() * .0018;
	let news = null;
	let focus;
	let newsBias = 0;
	if (Math.random() < .035) {
		const n = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
		news = {
			id: `${clock}-${Math.random().toString(36).slice(2, 7)}`,
			text: n.text,
			at: clock
		};
		newsBias = n.bias * (.6 + Math.random() * .8);
		focus = n.focus;
	}
	const next = { ...quotes };
	const nextHist = { ...histories };
	const hsiInst = BY_SYMBOL.HSI;
	let hsiLast = quotes.HSI?.last ?? hsiInst.start;
	for (const inst of UNIVERSE) {
		if (inst.symbol === "HSI") continue;
		const q = quotes[inst.symbol];
		const idio = gauss() * inst.vol * .18;
		const meanRev = (inst.start - q.last) / inst.start * .004;
		let jump = shock * inst.beta + idio + meanRev;
		if (focus && inst.symbol === focus) jump += newsBias * .04;
		else if (news) jump += newsBias * .01 * inst.beta;
		const sp = applySpread(inst, q.last * (1 + jump));
		const dayOpen = q.open;
		next[inst.symbol] = {
			...sp,
			open: dayOpen,
			high: Math.max(q.high, sp.last),
			low: Math.min(q.low, sp.last),
			prevClose: q.prevClose
		};
		const h = (nextHist[inst.symbol] ?? []).concat(sp.last);
		nextHist[inst.symbol] = h.length > 90 ? h.slice(-90) : h;
	}
	const weighted = UNIVERSE.filter((i) => i.weight > 0);
	const base = weighted.reduce((s, i) => s + i.start * i.weight, 0);
	const now = weighted.reduce((s, i) => s + (next[i.symbol]?.last ?? i.start) * i.weight, 0);
	const implied = hsiInst.start * (now / base);
	const hsiJump = news && !focus ? newsBias * 80 : gauss() * 12;
	hsiLast = implied * .85 + hsiLast * .15 + hsiJump;
	const hsiSp = applySpread(hsiInst, hsiLast);
	const hq = quotes.HSI;
	next.HSI = {
		...hsiSp,
		open: hq.open,
		high: Math.max(hq.high, hsiSp.last),
		low: Math.min(hq.low, hsiSp.last),
		prevClose: hq.prevClose
	};
	const hh = (nextHist.HSI ?? []).concat(hsiSp.last);
	nextHist.HSI = hh.length > 90 ? hh.slice(-90) : hh;
	const etf = BY_SYMBOL["2800"];
	const etfSp = applySpread(etf, next.HSI.last / 1e3);
	const eq = next["2800"];
	next["2800"] = {
		...etfSp,
		open: eq.open,
		high: Math.max(eq.high, etfSp.last),
		low: Math.min(eq.low, etfSp.last),
		prevClose: eq.prevClose
	};
	return {
		quotes: next,
		news,
		histories: nextHist
	};
}
function rollDay(quotes) {
	const next = {};
	for (const [sym, q] of Object.entries(quotes)) next[sym] = {
		...q,
		open: q.last,
		high: q.last,
		low: q.last,
		prevClose: q.last
	};
	return next;
}
function seedClock() {
	return (/* @__PURE__ */ new Date("2026-09-14T01:30:00Z")).getTime();
}
function seedHistories(quotes) {
	const h = {};
	for (const inst of UNIVERSE) h[inst.symbol] = [quotes[inst.symbol].last];
	return h;
}
function mergeQuotes(existing) {
	const seeded = seedQuotes();
	const out = {
		...seeded,
		...existing
	};
	for (const inst of UNIVERSE) if (!out[inst.symbol]) out[inst.symbol] = seeded[inst.symbol];
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
		positions: [],
		fills: [],
		news: [],
		speed: 1,
		selected: "0700",
		won: false,
		busted: false,
		toast: null,
		musicOn: false
	};
}
function markPrice(q, qty) {
	if (qty > 0) return q.bid;
	if (qty < 0) return q.ask;
	return q.last;
}
function notional(symbol, qty, price) {
	const inst = BY_SYMBOL[symbol];
	return Math.abs(qty) * price * inst.pointValue;
}
function positionValue(p, q) {
	const inst = BY_SYMBOL[p.symbol];
	const pnl = (markPrice(q, p.qty) - p.avgPrice) * p.qty * inst.pointValue;
	return notional(p.symbol, p.qty, p.avgPrice) / p.leverage + pnl;
}
function equityOf(cash, positions, quotes) {
	return cash + positions.reduce((s, p) => s + positionValue(p, quotes[p.symbol]), 0);
}
var useDesk = create()(persist((set, get) => ({
	...initial(),
	hydrateHistories: () => {
		const st = get();
		const quotes = mergeQuotes(st.quotes);
		set({
			quotes,
			candles: ensureCandles(st.candles, quotes, st.clock),
			histories: Object.keys(st.histories).length >= UNIVERSE.length ? st.histories : seedHistories(quotes)
		});
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
				hour12: false
			}).formatToParts(d);
		})();
		const hour = Number(hk.find((x) => x.type === "hour")?.value);
		const minute = Number(hk.find((x) => x.type === "minute")?.value);
		if (hour === 9 && minute === 30) quotes = rollDay(quotes);
		if (!isSession(clock)) clock = nextMarketOpen(clock);
		const stepped = stepMarket(quotes, st.histories, clock);
		let cash = st.cash;
		let positions = st.positions.map((p) => ({ ...p }));
		const liquidated = [];
		positions = positions.filter((p) => {
			const q = stepped.quotes[p.symbol];
			const inst = BY_SYMBOL[p.symbol];
			const pnl = (markPrice(q, p.qty) - p.avgPrice) * p.qty * inst.pointValue;
			const margin = notional(p.symbol, p.qty, p.avgPrice) / p.leverage;
			if (p.leverage > 1 && pnl <= -margin * .8) {
				cash += Math.max(0, margin + pnl);
				liquidated.push(p.symbol);
				return false;
			}
			return true;
		});
		const eq = equityOf(cash, positions, stepped.quotes);
		const news = stepped.news ? [stepped.news, ...st.news].slice(0, 24) : st.news;
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
			toast: liquidated.length ? `${liquidated.map((s) => BY_SYMBOL[s]?.name ?? s).join("、")} 已強制平倉` : st.toast
		});
	},
	place: (side, qty, leverage) => {
		const st = get();
		if (st.won || st.busted) return "模擬已結束";
		if (!Number.isFinite(qty) || qty <= 0) return "請輸入有效股數";
		const inst = BY_SYMBOL[st.selected];
		if (!inst) return "找不到股票";
		const q = st.quotes[st.selected];
		const price = side === "buy" ? q.ask : q.bid;
		const signed = side === "buy" ? qty : -qty;
		const lev = Math.min(Math.max(1, leverage), inst.maxLeverage);
		let positions = st.positions.map((p) => ({ ...p }));
		let cash = st.cash;
		const idx = positions.findIndex((p) => p.symbol === st.selected);
		const existing = idx >= 0 ? positions[idx] : null;
		if (existing && Math.sign(existing.qty) !== 0 && Math.sign(existing.qty) !== Math.sign(signed)) {
			const closeQty = Math.min(Math.abs(existing.qty), qty);
			const closeSigned = existing.qty > 0 ? -closeQty : closeQty;
			const instPv = inst.pointValue;
			const exit = closeSigned < 0 ? q.bid : q.ask;
			const pnl = (exit - existing.avgPrice) * (existing.qty > 0 ? closeQty : -closeQty) * instPv;
			const marginRelease = notional(st.selected, closeQty, existing.avgPrice) / existing.leverage;
			cash += marginRelease + pnl;
			const remain = existing.qty + closeSigned;
			if (remain === 0) positions.splice(idx, 1);
			else positions[idx] = {
				...existing,
				qty: remain
			};
			const leftover = qty - closeQty;
			const fills = [{
				id: `${st.clock}-${Math.random().toString(36).slice(2, 8)}`,
				clock: st.clock,
				symbol: st.selected,
				side,
				qty: closeQty,
				price: exit,
				leverage: existing.leverage
			}, ...st.fills].slice(0, 80);
			if (leftover <= 0) {
				set({
					cash,
					positions,
					fills
				});
				return null;
			}
			return get().place(side, leftover, lev);
		}
		const cost = notional(st.selected, qty, price) / lev;
		if (cost > cash + 1e-6) return "現金不足（已計入槓桿保證金）";
		cash -= cost;
		if (existing && existing.leverage === lev) {
			const newQty = existing.qty + signed;
			const newAvg = (existing.avgPrice * Math.abs(existing.qty) + price * qty) / Math.abs(newQty);
			positions[idx] = {
				...existing,
				qty: newQty,
				avgPrice: newAvg
			};
		} else if (existing) return "請先平倉再改槓桿倍數";
		else positions.push({
			symbol: st.selected,
			qty: signed,
			avgPrice: price,
			leverage: lev
		});
		const fills = [{
			id: `${st.clock}-${Math.random().toString(36).slice(2, 8)}`,
			clock: st.clock,
			symbol: st.selected,
			side,
			qty,
			price,
			leverage: lev
		}, ...st.fills].slice(0, 80);
		set({
			cash,
			positions,
			fills
		});
		return null;
	},
	closeSymbol: (symbol) => {
		const st = get();
		const p = st.positions.find((x) => x.symbol === symbol);
		if (!p) return;
		const q = st.quotes[symbol];
		const inst = BY_SYMBOL[symbol];
		const exit = p.qty > 0 ? q.bid : q.ask;
		const pnl = (exit - p.avgPrice) * p.qty * inst.pointValue;
		const margin = notional(symbol, p.qty, p.avgPrice) / p.leverage;
		const cash = st.cash + margin + pnl;
		const fills = [{
			id: `${st.clock}-c${Math.random().toString(36).slice(2, 7)}`,
			clock: st.clock,
			symbol,
			side: p.qty > 0 ? "sell" : "buy",
			qty: Math.abs(p.qty),
			price: exit,
			leverage: p.leverage
		}, ...st.fills].slice(0, 80);
		set({
			cash,
			positions: st.positions.filter((x) => x.symbol !== symbol),
			fills
		});
	},
	reset: () => set(initial())
}), {
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
		speed: 0
	})
}));
function Signed({ n, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("tabular-nums", n > 0 ? "text-up" : n < 0 ? "text-down" : "text-muted-foreground"),
		children
	});
}
function useTicker() {
	const tick = useDesk((s) => s.tick);
	const speed = useDesk((s) => s.speed);
	const won = useDesk((s) => s.won);
	const busted = useDesk((s) => s.busted);
	(0, import_react.useEffect)(() => {
		if (speed === 0 || won || busted) return;
		const id = window.setInterval(tick, Math.max(80, 900 / speed));
		return () => window.clearInterval(id);
	}, [
		tick,
		speed,
		won,
		busted
	]);
}
function Desk() {
	useTicker();
	const hydrateHistories = useDesk((s) => s.hydrateHistories);
	(0, import_react.useEffect)(() => {
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
	useDesk((s) => s.select);
	const won = useDesk((s) => s.won);
	const busted = useDesk((s) => s.busted);
	const reset = useDesk((s) => s.reset);
	const news = useDesk((s) => s.news);
	const fills = useDesk((s) => s.fills);
	useDesk((s) => s.histories);
	const toast = useDesk((s) => s.toast);
	const clearToast = useDesk((s) => s.clearToast);
	const equity = equityOf(cash, positions, quotes);
	const pnl = equity - STARTING_CASH;
	const hsi = quotes.HSI;
	const hsiChg = hsi ? (hsi.last - hsi.prevClose) / hsi.prevClose : 0;
	const progress = Math.min(1, equity / GOAL_EQUITY);
	(0, import_react.useEffect)(() => {
		if (!toast) return;
		const id = window.setTimeout(clearToast, 3200);
		return () => window.clearTimeout(id);
	}, [toast, clearToast]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-border px-4 py-3 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase",
							children: "PAPER HANG SENG"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-medium text-xl tracking-tight",
							children: "港股模擬盤"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpeedControl, {
									speed,
									onChange: setSpeed,
									disabled: won || busted
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MusicToggle, {
									on: musicOn,
									onChange: setMusicOn
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: reset,
									"aria-label": "重開戶口",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {}), "重開戶口"]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "模擬時間",
								value: formatSimTime(clock)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "恒生指數",
								value: hsi ? hsi.last.toLocaleString("en-HK") : "—",
								sub: hsi ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Signed, {
									n: hsiChg,
									children: [
										hsi.last - hsi.prevClose >= 0 ? "+" : "−",
										Math.abs(hsi.last - hsi.prevClose).toFixed(0),
										" ",
										formatPct(hsiChg)
									]
								}) : null
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "現金",
								value: formatHkd(cash)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "總資產",
								value: formatHkd(equity),
								sub: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Signed, {
									n: pnl,
									children: [
										formatHkd(pnl),
										" · ",
										formatPct(pnl / STARTING_CASH)
									]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"任務：由 ",
								formatHkd(STARTING_CASH, 0),
								" 做到財富自由"
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: formatHkd(GOAL_EQUITY, 0)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-1.5 overflow-hidden rounded-full bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full bg-primary transition-[width] duration-[var(--motion-fast)]",
								style: { width: `${Math.max(1.2, progress * 100)}%` }
							})
						})]
					})
				]
			}),
			news[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 border-b border-border bg-surface px-4 py-2 text-sm sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "outline",
					children: "行情"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "min-w-0 truncate text-muted-foreground",
					children: news[0].text
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "grid gap-px bg-border lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)_minmax(260px,0.85fr)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "order-2 bg-background lg:order-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Watchlist, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "order-1 bg-background p-4 sm:p-5 lg:order-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ticket, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "order-3 bg-background p-4 sm:p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Holdings, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-2 text-sm font-medium",
								children: "成交紀錄"
							}), fills.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "尚未落盤。買入以賣出價成交，賣出以買入價成交。"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "max-h-56 space-y-2 overflow-auto text-sm",
								children: fills.slice(0, 12).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: f.side === "buy" ? "text-up" : "text-down",
										children: [
											f.side === "buy" ? "買入" : "賣出",
											" ",
											f.symbol
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "tabular-nums text-muted-foreground",
										children: [
											formatQty(f.qty),
											" @ ",
											formatPrice(f.price),
											f.leverage > 1 ? ` ×${f.leverage}` : ""
										]
									})]
								}, f.id))
							})]
						})]
					})
				]
			}),
			(won || busted) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 sm:items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] tracking-[0.16em] text-muted-foreground",
							children: won ? "MISSION COMPLETE" : "MARGIN CALL"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 text-2xl font-medium tracking-tight",
							children: won ? "財富自由" : "戶口爆倉"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted-foreground",
							children: won ? "總資產已達港幣一億。你可以重開戶口，再以一萬本金挑戰一次。" : "保證金已耗盡，持倉被強制平倉。重開戶口後本金重置為港幣一萬。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 font-mono text-lg tabular-nums",
							children: formatHkd(equity)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-5 w-full",
							onClick: reset,
							children: "再來一局"
						})
					]
				})
			}),
			toast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-lg",
				children: toast
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "sr-only",
				children: ["已選 ", selected]
			})
		]
	});
}
function Stat({ label, value, sub }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] text-muted-foreground",
			children: label
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-mono text-base tabular-nums tracking-tight sm:text-lg",
			children: value
		}),
		sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs",
			children: sub
		}) : null
	] });
}
function MusicToggle({ on, onChange }) {
	const handle = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		handle.current = createAmbient();
		return () => handle.current?.stop();
	}, []);
	(0, import_react.useEffect)(() => {
		if (on) handle.current?.start().then(() => handle.current?.setMuted(false));
		else handle.current?.setMuted(true);
	}, [on]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "outline",
		size: "sm",
		onClick: () => onChange(!on),
		"aria-pressed": on,
		"aria-label": on ? "關閉 Lo-fi" : "開啟 Lo-fi",
		children: [on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, {}), on ? "Lo-fi 開" : "Lo-fi"]
	});
}
function SpeedControl({ speed, onChange, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex rounded-md border border-border p-0.5",
		children: [
			{
				s: 0,
				label: "暫停"
			},
			{
				s: 1,
				label: "1x"
			},
			{
				s: 4,
				label: "4x"
			},
			{
				s: 12,
				label: "12x"
			}
		].map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			disabled,
			onClick: () => onChange(o.s),
			className: cn("h-9 min-w-11 rounded-sm px-2.5 text-xs", speed === o.s ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"),
			children: o.label
		}, o.s))
	});
}
function Watchlist() {
	const quotes = useDesk((s) => s.quotes);
	const selected = useDesk((s) => s.selected);
	const select = useDesk((s) => s.select);
	const histories = useDesk((s) => s.histories);
	const [q, setQ] = (0, import_react.useState)("");
	const rows = (0, import_react.useMemo)(() => {
		const n = q.trim();
		return UNIVERSE.filter((i) => !n || i.symbol.includes(n) || i.name.includes(n) || i.sector.includes(n));
	}, [q]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 px-4 pt-4 sm:px-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "市場"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "搜尋代號 / 名稱",
					className: "h-9 max-w-48"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 hidden grid-cols-[72px_1fr_88px_72px] px-4 text-[11px] text-muted-foreground sm:grid sm:px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "代號" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "名稱" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-right",
						children: "賣 / 買"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-right",
						children: "走勢"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "max-h-[48vh] overflow-auto pb-4 lg:max-h-[70vh]",
				children: rows.map((inst) => {
					const qt = quotes[inst.symbol];
					if (!qt) return null;
					const chg = (qt.last - qt.prevClose) / qt.prevClose;
					const hist = histories[inst.symbol] ?? [qt.last];
					const active = selected === inst.symbol;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => select(inst.symbol),
						className: cn("grid w-full grid-cols-[72px_1fr_auto] items-center gap-2 px-4 py-2.5 text-left sm:grid-cols-[72px_1fr_88px_72px] sm:px-5", active ? "bg-secondary" : "hover:bg-secondary/60"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-sm tabular-nums",
								children: inst.symbol
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm",
									children: inst.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-muted-foreground",
									children: inst.sector
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-right",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block font-mono text-sm tabular-nums",
									children: formatPrice(qt.last)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Signed, {
									n: chg,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px]",
										children: formatPct(chg)
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden justify-end sm:flex",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, {
									data: hist,
									up: chg >= 0
								})
							})
						]
					}) }, inst.symbol);
				})
			})
		]
	});
}
function Ticket() {
	const selected = useDesk((s) => s.selected);
	const quotes = useDesk((s) => s.quotes);
	const candles = useDesk((s) => s.candles);
	const cash = useDesk((s) => s.cash);
	const place = useDesk((s) => s.place);
	const inst = BY_SYMBOL[selected];
	const q = quotes[selected];
	const [qty, setQty] = (0, import_react.useState)("1");
	const [lev, setLev] = (0, import_react.useState)(1);
	const [err, setErr] = (0, import_react.useState)(null);
	const [tf, setTf] = (0, import_react.useState)("15m");
	(0, import_react.useEffect)(() => {
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
	function submit(side) {
		const msg = place(side, n, levClamped);
		setErr(msg);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-sm text-muted-foreground",
				children: inst.symbol
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-medium tracking-tight",
				children: inst.name
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				variant: inst.kind === "index" ? "outline" : "default",
				children: inst.kind === "index" ? "指數差價 · 每點 HK$1" : inst.kind === "etf" ? "ETF" : "正股 · 支援碎股"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex items-end gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-3xl tabular-nums tracking-tight",
				children: formatPrice(q.last)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Signed, {
				n: chg,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm",
					children: formatPct(chg)
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 flex rounded-md border border-border p-0.5",
			children: [
				{
					id: "5m",
					label: "5分鐘"
				},
				{
					id: "15m",
					label: "15分鐘"
				},
				{
					id: "1d",
					label: "日線"
				}
			].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setTf(t.id),
				className: cn("h-9 flex-1 rounded-sm text-xs", tf === t.id ? "bg-secondary text-foreground" : "text-muted-foreground"),
				children: t.label
			}, t.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CandleChart, { candles: series })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 space-y-2 rounded-lg border border-border bg-card p-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] tracking-wide text-muted-foreground",
				children: "技術走勢提示 · 教學用途，非投資建議"
			}), hints.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("text-sm font-medium", h.bias === "up" ? "text-up" : h.bias === "down" ? "text-down" : "text-foreground"),
				children: h.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[12px] leading-relaxed text-muted-foreground",
				children: h.body
			})] }, h.title))]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 grid grid-cols-2 gap-2 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg bg-down-soft px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-down",
					children: "買入價 Bid（賣出成交）"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-lg tabular-nums text-down",
					children: formatPrice(q.bid)
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg bg-up-soft px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-up",
					children: "賣出價 Ask（買入成交）"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-lg tabular-nums text-up",
					children: formatPrice(q.ask)
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-[11px] leading-relaxed text-muted-foreground",
			children: "港股慣例：紅升綠跌。買入以賣出價成交，賣出以買入價成交。可沽空。恒指迷你最高十倍槓桿。"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs text-muted-foreground",
					children: [
						"數量",
						inst.kind === "index" ? "（口）" : "（股）",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							inputMode: "numeric",
							value: qty,
							onChange: (e) => setQty(e.target.value.replace(/[^\d]/g, ""))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						"槓桿（最高 ",
						inst.maxLeverage,
						"x）"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 flex gap-1",
					children: [
						1,
						2,
						5,
						10
					].filter((x) => x <= inst.maxLeverage).map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setLev(x),
						className: cn("h-11 flex-1 rounded-md border text-sm", levClamped === x ? "border-primary bg-secondary" : "border-border text-muted-foreground"),
						children: [x, "x"]
					}, x))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["買入保證金 ", formatHkd(buyMargin)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["可用現金 ", formatHkd(cash)] })]
				}),
				err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-up",
					children: err
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "buy",
						onClick: () => submit("buy"),
						children: ["買入 @ ", formatPrice(q.ask)]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "sell",
						onClick: () => submit("sell"),
						children: ["賣出 @ ", formatPrice(q.bid)]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[11px] text-muted-foreground",
					children: [
						"賣出名義 ",
						formatHkd(sellNotional),
						levClamped > 1 ? ` · 保證金佔名義 1/${levClamped}` : ""
					]
				})
			]
		})
	] });
}
function Holdings() {
	const positions = useDesk((s) => s.positions);
	const quotes = useDesk((s) => s.quotes);
	const closeSymbol = useDesk((s) => s.closeSymbol);
	const select = useDesk((s) => s.select);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
		className: "mb-2 flex items-center gap-2 text-sm font-medium",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-4 text-muted-foreground" }), "持倉"]
	}), positions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-sm text-muted-foreground",
		children: [
			"空倉。本金 ",
			formatHkd(STARTING_CASH, 0),
			"，目標 ",
			formatHkd(GOAL_EQUITY, 0),
			"。"
		]
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-2",
		children: positions.map((p) => {
			const inst = BY_SYMBOL[p.symbol];
			const q = quotes[p.symbol];
			const val = positionValue(p, q);
			const pnl = ((p.qty > 0 ? q.bid : q.ask) - p.avgPrice) * p.qty * inst.pointValue;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-lg border border-border bg-card p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "text-left",
						onClick: () => select(p.symbol),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm",
							children: [
								inst.name,
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-muted-foreground",
									children: p.symbol
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted-foreground",
							children: [
								p.qty > 0 ? "好倉" : "淡倉",
								" ",
								formatQty(Math.abs(p.qty)),
								" · 均價 ",
								formatPrice(p.avgPrice),
								p.leverage > 1 ? ` · ${p.leverage}x` : ""
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "size-11 text-muted-foreground hover:text-foreground",
						onClick: () => closeSymbol(p.symbol),
						"aria-label": `平倉 ${inst.name}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "mx-auto size-4" })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 flex justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono tabular-nums text-muted-foreground",
						children: formatHkd(val)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Signed, {
						n: pnl,
						children: formatHkd(pnl)
					})]
				})]
			}, p.symbol);
		})
	})] });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, {});
}
//#endregion
export { Home as component };
