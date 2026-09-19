(() => {
  const START = 10000;
  const GOAL = 1e8;
  const SAVE = "apex-jade-desk-v3";
  const UNIVERSE = [
    { s: "HSI", n: "恒生指數迷你", k: "index", start: 25842, vol: 0.012, beta: 1, pv: 1, lev: 10, lot: 1 },
    { s: "2800", n: "盈富基金", k: "etf", start: 25.84, vol: 0.01, beta: 1, pv: 1, lev: 1, lot: 100 },
    { s: "0005", n: "匯豐控股", start: 88.45, vol: 0.011, beta: 0.85, pv: 1, lev: 5, lot: 400 },
    { s: "0700", n: "騰訊控股", start: 412.6, vol: 0.018, beta: 1.25, pv: 1, lev: 5, lot: 100 },
    { s: "9988", n: "阿里巴巴", start: 92.15, vol: 0.02, beta: 1.3, pv: 1, lev: 5, lot: 100 },
    { s: "3690", n: "美團", start: 118.3, vol: 0.024, beta: 1.35, pv: 1, lev: 5, lot: 100 },
    { s: "1810", n: "小米集團", start: 48.75, vol: 0.026, beta: 1.4, pv: 1, lev: 5, lot: 200 },
    { s: "0941", n: "中國移動", start: 76.2, vol: 0.009, beta: 0.55, pv: 1, lev: 2, lot: 500 },
    { s: "1299", n: "友邦保險", start: 68.9, vol: 0.013, beta: 0.9, pv: 1, lev: 5, lot: 200 },
    { s: "0388", n: "港交所", start: 352.4, vol: 0.016, beta: 1.1, pv: 1, lev: 5, lot: 100 },
    { s: "2318", n: "中國平安", start: 47.85, vol: 0.017, beta: 1.05, pv: 1, lev: 5, lot: 500 },
    { s: "1211", n: "比亞迪股份", start: 268, vol: 0.022, beta: 1.2, pv: 1, lev: 5, lot: 50 },
    { s: "0434", n: "博雅互動", start: 5.18, vol: 0.038, beta: 1.15, pv: 1, lev: 5, lot: 400 },
    { s: "3988", n: "中國銀行", start: 4.21, vol: 0.01, beta: 0.72, pv: 1, lev: 2, lot: 1000 },
    { s: "9618", n: "京東集團", start: 128.5, vol: 0.023, beta: 1.28, pv: 1, lev: 5, lot: 50 },
    { s: "9999", n: "網易", start: 154.8, vol: 0.019, beta: 1.15, pv: 1, lev: 5, lot: 100 },
    { s: "0001", n: "長和", start: 46.2, vol: 0.012, beta: 0.7, pv: 1, lev: 2, lot: 500 },
    { s: "0002", n: "中電控股", start: 64.75, vol: 0.007, beta: 0.35, pv: 1, lev: 2, lot: 500 },
    { s: "0011", n: "恒生銀行", start: 108.3, vol: 0.01, beta: 0.65, pv: 1, lev: 2, lot: 100 },
    { s: "0175", n: "吉利汽車", start: 16.42, vol: 0.025, beta: 1.22, pv: 1, lev: 5, lot: 500 },
    { s: "2020", n: "安踏體育", start: 86.5, vol: 0.018, beta: 0.95, pv: 1, lev: 5, lot: 200 },
    { s: "2382", n: "舜宇光學", start: 62.8, vol: 0.028, beta: 1.32, pv: 1, lev: 5, lot: 100 },
    { s: "1024", n: "快手", start: 52.4, vol: 0.03, beta: 1.45, pv: 1, lev: 5, lot: 100 },
    { s: "9961", n: "攜程集團", start: 478, vol: 0.021, beta: 1.18, pv: 1, lev: 5, lot: 50 },
    { s: "9888", n: "百度集團", start: 91.2, vol: 0.022, beta: 1.2, pv: 1, lev: 5, lot: 50 },
  ];
  const BY = Object.fromEntries(UNIVERSE.map((i) => [i.s, i]));
  const NEWS = [
    { t: "北水持續淨流入，港股氣氛轉旺", b: 0.45 },
    { t: "聯儲局官員放鴿，資金重新追逐風險資產", b: 0.55 },
    { t: "騰訊遊戲版號獲批，科技股急彈", b: 0.7, f: "0700" },
    { t: "阿里雲簽下大型企業合約，電商板塊跟漲", b: 0.5, f: "9988" },
    { t: "小米新機預售超預期，硬件股活躍", b: 0.6, f: "1810" },
    { t: "港交所成交額創月內新高", b: 0.35, f: "0388" },
    { t: "匯豐上調亞洲業務指引", b: 0.4, f: "0005" },
    { t: "友邦新業務價值勝預期", b: 0.35, f: "1299" },
    { t: "比亞迪海外銷量再創新高", b: 0.5, f: "1211" },
    { t: "博雅互動海外棋牌流水回升，股份交投轉旺", b: 0.55, f: "0434" },
    { t: "中國銀行息差穩定，派息率維持進取", b: 0.3, f: "3988" },
    { t: "地緣風險升溫，資金湧入防守股", b: -0.35 },
    { t: "港元拆息抽升，金融股受壓", b: -0.4, f: "0005" },
    { t: "監管傳聞再起，科網股高位回吐", b: -0.55 },
    { t: "美團即時零售競爭加劇，市場憂慮利潤率", b: -0.45, f: "3690" },
    { t: "內地樓市數據遜預期，地產相關受挫", b: -0.4, f: "0001" },
  ];

  function gauss() {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function tickSize(p) {
    if (p < 0.25) return 0.001;
    if (p < 0.5) return 0.005;
    if (p < 10) return 0.01;
    if (p < 20) return 0.02;
    if (p < 50) return 0.05;
    if (p < 100) return 0.1;
    if (p < 200) return 0.2;
    if (p < 500) return 0.5;
    if (p < 1000) return 1;
    if (p < 2000) return 2;
    return 5;
  }
  function rnd(p, inst) {
    const t = inst.k === "index" ? 1 : tickSize(p);
    return Math.max(t, Math.round(p / t) * t);
  }
  function fmtH(n) {
    const a = Math.abs(n), s = n < 0 ? "−" : "";
    if (a >= 1e7) return s + "HK$" + (a / 1e6).toFixed(2) + "M";
    return s + "HK$" + a.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtP(n) {
    if (n >= 1000) return n.toFixed(1);
    if (n >= 10) return n.toFixed(2);
    return n.toFixed(3);
  }
  function fmtPct(n) {
    return (n > 0 ? "+" : n < 0 ? "−" : "") + (Math.abs(n) * 100).toFixed(2) + "%";
  }
  function fmtTime(ms) {
    return new Intl.DateTimeFormat("zh-HK", {
      timeZone: "Asia/Hong_Kong",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(ms));
  }
  function esc(s) {
    return String(s)
      .replace(/&/g, "&" + "amp;")
      .replace(/</g, "&" + "lt;")
      .replace(/>/g, "&" + "gt;")
      .replace(/"/g, "&" + "quot;")
      .replace(/'/g, "&#39;");
  }

  function seedQuotes() {
    const q = {};
    for (const i of UNIVERSE) {
      const last = rnd(i.start, i);
      const t = i.k === "index" ? 1 : tickSize(last);
      q[i.s] = { last, bid: rnd(last - t, i), ask: rnd(last + t, i), prev: last, o: last, h: last, l: last };
    }
    return q;
  }
  function seedCandles(quotes) {
    const book = {};
    for (const i of UNIVERSE) {
      const mk = (n, vol) => {
        const arr = [];
        let p = quotes[i.s].last;
        for (let k = n; k >= 0; k--) {
          p = Math.max(i.start * 0.45, p * (1 + gauss() * vol));
          const c = rnd(p, i);
          const o = rnd(c * (1 + (Math.random() - 0.5) * vol * 0.8), i);
          const w = Math.abs(c - o) * (0.4 + Math.random());
          arr.push({ o, h: Math.max(o, c) + w * 0.4, l: Math.min(o, c) - w * 0.4, c });
        }
        return arr;
      };
      book[i.s] = { "1d": mk(70, i.vol * 0.4), "15m": mk(64, i.vol * 0.25), "5m": mk(72, i.vol * 0.18) };
    }
    return book;
  }
  function sma(arr, n) {
    if (arr.length < n) return null;
    return arr.slice(-n).reduce((a, b) => a + b, 0) / n;
  }
  function rsi(cl, n = 14) {
    if (cl.length < n + 1) return null;
    let g = 0, l = 0;
    for (let i = cl.length - n; i < cl.length; i++) {
      const d = cl[i] - cl[i - 1];
      if (d >= 0) g += d;
      else l -= d;
    }
    if (!l) return 100;
    return 100 - 100 / (1 + g / l);
  }
  function hints(cs) {
    const cl = cs.map((c) => c.c);
    const last = cl.at(-1);
    const m20 = sma(cl, Math.min(20, cl.length));
    const r = rsi(cl);
    const out = [];
    if (cs.length >= 2) {
      const a = cs.at(-2), b = cs.at(-1);
      const body = Math.abs(b.c - b.o), rng = b.h - b.l || 1e-9;
      const lower = Math.min(b.o, b.c) - b.l, upper = b.h - Math.max(b.o, b.c);
      const up = b.c >= b.o;
      if (body / rng < 0.12) out.push(["neu", "十字星（Doji）", "實體很短，多空暫時平衡。急升急跌後常見於轉向觀察點。"]);
      else if (lower > body * 2 && upper < body * 0.6 && up)
        out.push(["up", "錘頭（Hammer）", "長下影線顯示低位有買盤承接，需等下一根確認。"]);
      else if (upper > body * 2 && lower < body * 0.6 && !up)
        out.push(["down", "射擊之星", "長上影線代表高位賣壓，貼近阻力時視為回吐警號。"]);
      else if (a.c < a.o && up && b.o <= a.c && b.c >= a.o)
        out.push(["up", "陽包陰", "陽燭覆蓋前陰，短線轉強形態。站上 SMA20 更有力。"]);
      else if (a.c >= a.o && !up && b.o >= a.c && b.c <= a.o)
        out.push(["down", "陰包陽", "陰燭覆蓋前陽，顯示賣盤轉強。"]);
    }
    if (m20 != null) {
      out.push(
        last > m20 * 1.004
          ? ["up", "價格在 SMA20 之上", "短線結構偏多，回踩均線可觀察承接。"]
          : last < m20 * 0.996
            ? ["down", "價格在 SMA20 之下", "短線結構偏空，反彈至均線或遇阻力。"]
            : ["neu", "貼近均線", "方向未明，等下一根確認。"]
      );
    }
    if (r != null) {
      out.push(
        r >= 70
          ? ["down", "RSI " + r.toFixed(0) + " 超買", "升勢或過熱，宜防回吐。"]
          : r <= 30
            ? ["up", "RSI " + r.toFixed(0) + " 超賣", "跌勢或過急，需等陽燭確認。"]
            : ["neu", "RSI " + r.toFixed(0) + " 中性", "動能未極端。"]
      );
    }
    return out.slice(0, 4);
  }

  function fresh() {
    return {
      cash: START,
      quotes: seedQuotes(),
      candles: null,
      pos: [],
      fills: [],
      news: "模擬開市。買入以賣出價成交，賣出以買入價成交。紅升綠跌。",
      sel: "0700",
      speed: 1,
      tf: "15m",
      qty: "100",
      lev: 1,
      music: false,
      won: false,
      busted: false,
      clock: Date.parse("2026-09-14T01:30:00Z"),
      filter: "",
      toast: null,
    };
  }

  const state = fresh();
  state.candles = seedCandles(state.quotes);

  try {
    const raw = localStorage.getItem(SAVE);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && typeof s.cash === "number") {
        Object.assign(state, {
          cash: s.cash,
          pos: s.pos || [],
          fills: s.fills || [],
          sel: BY[s.sel] ? s.sel : "0700",
          speed: [0, 1, 4, 12].includes(s.speed) ? s.speed : 1,
          tf: ["5m", "15m", "1d"].includes(s.tf) ? s.tf : "15m",
          qty: String(s.qty || "100"),
          lev: s.lev || 1,
          won: !!s.won,
          busted: !!s.busted,
          clock: s.clock || state.clock,
        });
      }
    }
  } catch (_) {}

  function persist() {
    try {
      localStorage.setItem(
        SAVE,
        JSON.stringify({
          cash: state.cash,
          pos: state.pos,
          fills: state.fills.slice(0, 40),
          sel: state.sel,
          speed: state.speed,
          tf: state.tf,
          qty: state.qty,
          lev: state.lev,
          won: state.won,
          busted: state.busted,
          clock: state.clock,
        })
      );
    } catch (_) {}
  }

  function equity() {
    return (
      state.cash +
      state.pos.reduce((s, p) => {
        const q = state.quotes[p.s];
        const inst = BY[p.s];
        const mtm = p.qty > 0 ? q.bid : q.ask;
        const pnl = (mtm - p.avg) * p.qty * inst.pv;
        const margin = (Math.abs(p.qty) * p.avg * inst.pv) / p.lev;
        return s + margin + pnl;
      }, 0)
    );
  }

  function toast(msg) {
    state.toast = msg;
    render();
    setTimeout(() => {
      if (state.toast === msg) {
        state.toast = null;
        render();
      }
    }, 2800);
  }

  function pushC(sym, last) {
    const book = state.candles[sym];
    for (const tf of ["5m", "15m", "1d"]) {
      const arr = book[tf];
      const c = arr.at(-1);
      if (c) {
        c.c = last;
        c.h = Math.max(c.h, last);
        c.l = Math.min(c.l, last);
      }
      const every = tf === "5m" ? 5 : tf === "15m" ? 15 : 240;
      if (arr.length && arr.length % every === 0) arr.push({ o: last, h: last, l: last, c: last });
      if (arr.length > 96) arr.shift();
    }
  }

  function step() {
    if (!state.speed || state.won || state.busted) return;
    const shock = gauss() * 0.0018;
    let newsBias = 0;
    let newsFocus = null;
    if (Math.random() < 0.028) {
      const n = NEWS[Math.floor(Math.random() * NEWS.length)];
      state.news = n.t;
      newsBias = n.b * 0.004;
      newsFocus = n.f || null;
    }
    for (const i of UNIVERSE) {
      if (i.s === "HSI" || i.s === "2800") continue;
      const q = state.quotes[i.s];
      const extra = newsFocus === i.s ? newsBias * 2.4 : newsBias * i.beta;
      const raw = q.last * (1 + shock * i.beta + gauss() * i.vol * 0.18 + extra);
      const last = rnd(raw, i);
      const t = tickSize(last);
      q.last = last;
      q.bid = rnd(last - t, i);
      q.ask = rnd(last + t, i);
      q.h = Math.max(q.h, last);
      q.l = Math.min(q.l, last);
      pushC(i.s, last);
    }
    const names = UNIVERSE.filter((i) => i.s !== "HSI" && i.s !== "2800");
    const avg = names.reduce((s, i) => s + state.quotes[i.s].last / i.start, 0) / names.length;
    const H = BY.HSI;
    const hl = rnd(H.start * avg * (1 + gauss() * 0.002), H);
    const hq = state.quotes.HSI;
    hq.last = hl;
    hq.bid = hl - 1;
    hq.ask = hl + 1;
    pushC("HSI", hl);
    const etf = rnd(hl / 1000, BY["2800"]);
    const eq = state.quotes["2800"];
    eq.last = etf;
    eq.bid = rnd(etf - 0.01, BY["2800"]);
    eq.ask = rnd(etf + 0.01, BY["2800"]);
    pushC("2800", etf);
    state.clock += 60000 * state.speed;
    const eqy = equity();
    if (eqy >= GOAL) {
      state.won = true;
      state.speed = 0;
    }
    if (eqy <= 0) {
      state.busted = true;
      state.speed = 0;
    }
    persist();
    render();
  }

  function place(side) {
    if (state.won || state.busted) return;
    const inst = BY[state.sel], q = state.quotes[state.sel];
    const qty = Math.max(0, Math.floor(+state.qty || 0));
    if (!qty) return toast("請輸入數量");
    const lev = Math.min(state.lev, inst.lev);
    const price = side === "buy" ? q.ask : q.bid;
    const signed = side === "buy" ? qty : -qty;
    const exist = state.pos.find((p) => p.s === state.sel);
    if (exist && Math.sign(exist.qty) !== Math.sign(signed)) {
      const cq = Math.min(Math.abs(exist.qty), qty);
      const exit = exist.qty > 0 ? q.bid : q.ask;
      const pnl = (exit - exist.avg) * (exist.qty > 0 ? cq : -cq) * inst.pv;
      const margin = (cq * exist.avg * inst.pv) / exist.lev;
      state.cash += margin + pnl;
      exist.qty += exist.qty > 0 ? -cq : cq;
      if (exist.qty === 0) state.pos = state.pos.filter((p) => p !== exist);
      state.fills.unshift({ side, s: state.sel, qty: cq, price: exit, t: state.clock });
      toast((side === "buy" ? "回補 " : "平倉 ") + inst.n + " " + cq + " @ " + fmtP(exit));
      persist();
      render();
      return;
    }
    const cost = (qty * price * inst.pv) / lev;
    if (cost > state.cash + 1e-9) return toast("現金不足（需 " + fmtH(cost) + "）");
    state.cash -= cost;
    if (exist && exist.lev === lev) {
      const nq = exist.qty + signed;
      exist.avg = (exist.avg * Math.abs(exist.qty) + price * qty) / Math.abs(nq);
      exist.qty = nq;
    } else if (exist) {
      return toast("請先平倉再改槓桿");
    } else {
      state.pos.push({ s: state.sel, qty: signed, avg: price, lev });
    }
    state.fills.unshift({ side, s: state.sel, qty, price, t: state.clock });
    toast((side === "buy" ? "買入 " : "賣出 ") + inst.n + " " + qty + " @ " + fmtP(price));
    persist();
    render();
  }

  let ticker = null;
  function toggleMusic() {
    state.music = !state.music;
    if (state.music) startTicker();
    else if (ticker) ticker.pause();
    render();
  }
  function startTicker() {
    if (!ticker) {
      ticker = new Audio("audio/market-ticker.mp3");
      ticker.loop = true;
      ticker.preload = "auto";
      ticker.volume = 0.62;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && state.music && ticker) {
          ticker.play().catch(() => {});
        }
      });
    }
    ticker.play().catch(() => {});
  }

  function drawChart(el, cs) {
    const dpr = devicePixelRatio || 1;
    const w = el.clientWidth, h = 240;
    el.width = w * dpr;
    el.height = h * dpr;
    const ctx = el.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const data = cs.slice(-64);
    if (!data.length) return;
    let min = Math.min(...data.map((c) => c.l)), max = Math.max(...data.map((c) => c.h));
    if (min === max) {
      min *= 0.99;
      max *= 1.01;
    }
    const pad = 52, plotW = w - pad - 10, plotH = h - 24;
    const y = (v) => 12 + ((max - v) / (max - min)) * plotH;
    const slot = plotW / data.length;
    ctx.strokeStyle = "#2a2d29";
    ctx.fillStyle = "#8b9188";
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.textAlign = "right";
    for (let i = 0; i < 4; i++) {
      const v = max - ((max - min) * i) / 3;
      ctx.beginPath();
      ctx.moveTo(pad, y(v));
      ctx.lineTo(w - 8, y(v));
      ctx.stroke();
      ctx.fillText(fmtP(v), pad - 6, y(v) + 3);
    }
    const cl = data.map((c) => c.c);
    const m = sma(cl, Math.min(20, cl.length));
    if (m != null) {
      ctx.strokeStyle = "#c5cbc488";
      ctx.beginPath();
      data.forEach((_, i) => {
        const slice = cl.slice(Math.max(0, i - 19), i + 1);
        const v = slice.reduce((a, b) => a + b, 0) / slice.length;
        const x = pad + slot * i + slot / 2;
        if (i) ctx.lineTo(x, y(v));
        else ctx.moveTo(x, y(v));
      });
      ctx.stroke();
    }
    data.forEach((c, i) => {
      const x = pad + slot * i + slot / 2;
      const up = c.c >= c.o;
      const col = up ? "#c4453c" : "#2f8f6b";
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x, y(c.h));
      ctx.lineTo(x, y(c.l));
      ctx.stroke();
      const top = y(Math.max(c.o, c.c)), bot = y(Math.min(c.o, c.c));
      ctx.fillRect(x - Math.max(2, slot * 0.28), top, Math.max(2, slot * 0.56), Math.max(1, bot - top));
    });
  }

  function hardReset() {
    const keepMusic = state.music;
    Object.assign(state, fresh());
    state.candles = seedCandles(state.quotes);
    state.music = keepMusic;
    persist();
    render();
  }

  function render() {
    const inst = BY[state.sel], q = state.quotes[state.sel], eq = equity(), pnl = eq - START, hsi = state.quotes.HSI;
    const hsich = (hsi.last - hsi.prev) / hsi.prev;
    const chg = (q.last - q.prev) / q.prev;
    const series = state.candles[state.sel][state.tf];
    const hs = hints(series);
    const progress = Math.min(100, (eq / GOAL) * 100);
    const list = UNIVERSE.filter((i) => {
      const n = state.filter.trim();
      if (!n) return true;
      return i.s.includes(n) || i.n.includes(n);
    });
    const $ = document.getElementById("app");
    $.innerHTML = `
      <header class="top">
        <div class="top-row">
          <div>
            <p class="kicker">Apex Jade · Paper Hang Seng</p>
            <h1>港股模擬盤</h1>
          </div>
          <div class="controls">
            <div class="bar">${[0, 1, 4, 12].map((s) => `<button type="button" class="${state.speed === s ? "on" : ""}" data-speed="${s}">${s === 0 ? "暫停" : s + "x"}</button>`).join("")}</div>
            <button type="button" class="ghost" id="ticker" aria-pressed="${state.music}">${state.music ? "行情 開" : "行情"}</button>
            <button type="button" class="ghost" id="reset">重開戶口</button>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><label>模擬時間（香港）</label><div class="v mono">${esc(fmtTime(state.clock))}</div></div>
          <div class="stat"><label>恒生指數</label><div class="v mono">${hsi.last.toLocaleString("en-HK")}</div><small class="${hsich >= 0 ? "up" : "down"}">${fmtPct(hsich)}</small></div>
          <div class="stat"><label>現金</label><div class="v mono">${fmtH(state.cash)}</div></div>
          <div class="stat"><label>總資產</label><div class="v mono">${fmtH(eq)}</div><small class="${pnl >= 0 ? "up" : "down"}">${fmtH(pnl)}</small></div>
          <div class="stat"><label>任務 財富自由 HK$1億</label><div class="progress" aria-label="進度"><i style="width:${progress.toFixed(2)}%"></i></div><small class="muted">${progress.toFixed(3)}%</small></div>
        </div>
      </header>
      <div class="news"><b>NEWS</b><span>${esc(state.news)}</span></div>
      <main class="desk">
        <section class="col">
          <input class="search" id="q" value="${esc(state.filter)}" placeholder="搜尋代號 / 名稱，如 0434、中行" />
          <div class="list" id="list">${list.map((i) => {
            const qq = state.quotes[i.s];
            const c = (qq.last - qq.prev) / qq.prev;
            return `<button type="button" class="row-item ${state.sel === i.s ? "active" : ""}" data-s="${i.s}"><span class="mono sym">${i.s}</span><span class="name">${i.n}</span><span class="mono px ${c >= 0 ? "up" : "down"}">${fmtP(qq.last)}<br><small>${fmtPct(c)}</small></span></button>`;
          }).join("") || `<p class="muted">沒有符合的股份。</p>`}</div>
        </section>
        <section class="col">
          <div class="muted mono">${inst.s} · 每手 ${inst.lot}</div>
          <h2>${inst.n}</h2>
          <div class="price-line"><span class="last mono">${fmtP(q.last)}</span><span class="${chg >= 0 ? "up" : "down"}">${fmtPct(chg)}</span></div>
          <div class="bar">${[["5m", "5分鐘"], ["15m", "15分鐘"], ["1d", "日線"]].map(([id, l]) => `<button type="button" class="${state.tf === id ? "on" : ""}" data-tf="${id}">${l}</button>`).join("")}</div>
          <canvas class="kline" id="kline"></canvas>
          <div class="hints">
            <div class="muted">技術走勢提示 · 教學用途，非投資建議</div>
            ${hs.map((h) => `<p class="${h[0] === "up" ? "up" : h[0] === "down" ? "down" : ""}"><b>${h[1]}</b><br><span class="muted">${h[2]}</span></p>`).join("")}
          </div>
          <div class="bidask">
            <div class="bid"><div class="cap">買入價 Bid（賣出成交）</div><div class="px mono">${fmtP(q.bid)}</div></div>
            <div class="ask"><div class="cap">賣出價 Ask（買入成交）</div><div class="px mono">${fmtP(q.ask)}</div></div>
          </div>
          <div class="ticket">
            <label>數量（可碎股）<input class="qty" id="qty" value="${esc(state.qty)}" inputmode="numeric" /></label>
            <div class="muted" style="margin-top:10px">槓桿（最高 ${inst.lev}x）</div>
            <div class="lev bar">${[1, 2, 5, 10].filter((x) => x <= inst.lev).map((x) => `<button type="button" class="${state.lev === x ? "on" : ""}" data-lev="${x}">${x}x</button>`).join("")}</div>
            <div class="actions">
              <button type="button" class="buy" id="buy">買入 @ ${fmtP(q.ask)}</button>
              <button type="button" class="sell" id="sell">賣出 @ ${fmtP(q.bid)}</button>
            </div>
          </div>
        </section>
        <section class="col">
          <h3>持倉</h3>
          ${state.pos.length ? state.pos.map((p) => {
            const i = BY[p.s], qq = state.quotes[p.s], mtm = p.qty > 0 ? qq.bid : qq.ask, upnl = (mtm - p.avg) * p.qty * i.pv;
            return `<div class="pos"><div>${i.n} <span class="muted mono">${p.s}</span></div><div class="meta">${p.qty > 0 ? "好倉" : "淡倉"} ${Math.abs(p.qty)} · 均價 ${fmtP(p.avg)} · ${p.lev}x</div><div class="mono ${upnl >= 0 ? "up" : "down"}">${fmtH(upnl)}</div><button type="button" class="ghost" style="margin-top:8px" data-close="${p.s}">平倉</button></div>`;
          }).join("") : `<p class="muted">空倉。本金 ${fmtH(START)}，目標 ${fmtH(GOAL)}。可用槓桿放大恆指迷你倉。</p>`}
          <h3 style="margin-top:18px">成交</h3>
          ${state.fills.slice(0, 10).map((f) => `<div class="fill"><span>${f.side === "buy" ? "買入" : "賣出"} ${f.s} ${f.qty}</span><span class="mono">@ ${fmtP(f.price)}</span></div>`).join("") || `<p class="muted">尚未落盤。</p>`}
        </section>
      </main>
      <footer class="site">
        <span>apex-jade-onyx-harbor · 教學模擬，並非真實報價或投資建議</span>
        <span>紅升綠跌 · Ask 買 / Bid 賣</span>
      </footer>
      ${state.won || state.busted ? `<div class="modal"><div class="box"><p class="kicker">${state.won ? "MISSION COMPLETE" : "MARGIN CALL"}</p><h2>${state.won ? "財富自由" : "戶口爆倉"}</h2><p class="muted">${state.won ? "總資產已達港幣一億。你可以重開戶口再挑戰一局。" : "保證金已耗盡。市場不會等你，再來一局。"}</p><p class="mono" style="font-size:22px;margin:12px 0">${fmtH(eq)}</p><button type="button" class="ghost" id="again">再來一局</button></div></div>` : ""}
      ${state.toast ? `<div class="toast" role="status">${esc(state.toast)}</div>` : ""}
    `;
    const cnv = document.getElementById("kline");
    if (cnv) drawChart(cnv, series);
    $.querySelectorAll("[data-s]").forEach((b) => {
      b.onclick = () => {
        state.sel = b.dataset.s;
        state.lev = Math.min(state.lev, BY[state.sel].lev);
        persist();
        render();
      };
    });
    $.querySelectorAll("[data-speed]").forEach((b) => {
      b.onclick = () => {
        state.speed = +b.dataset.speed;
        persist();
        render();
      };
    });
    $.querySelectorAll("[data-tf]").forEach((b) => {
      b.onclick = () => {
        state.tf = b.dataset.tf;
        persist();
        render();
      };
    });
    $.querySelectorAll("[data-lev]").forEach((b) => {
      b.onclick = () => {
        state.lev = +b.dataset.lev;
        persist();
        render();
      };
    });
    $.querySelectorAll("[data-close]").forEach((b) => {
      b.onclick = () => {
        const p = state.pos.find((x) => x.s === b.dataset.close);
        if (!p) return;
        state.sel = p.s;
        state.qty = String(Math.abs(p.qty));
        place(p.qty > 0 ? "sell" : "buy");
      };
    });
    const qin = document.getElementById("qty");
    if (qin) qin.oninput = (e) => {
      state.qty = e.target.value.replace(/[^\d]/g, "");
    };
    const buy = document.getElementById("buy");
    if (buy) buy.onclick = () => place("buy");
    const sell = document.getElementById("sell");
    if (sell) sell.onclick = () => place("sell");
    const tickerBtn = document.getElementById("ticker");
    if (tickerBtn) tickerBtn.onclick = toggleMusic;
    const reset = document.getElementById("reset");
    if (reset) reset.onclick = () => {
      if (confirm("重開戶口會清空持倉與進度。確定？")) hardReset();
    };
    const again = document.getElementById("again");
    if (again) again.onclick = hardReset;
    const search = document.getElementById("q");
    if (search) {
      search.oninput = (e) => {
        state.filter = e.target.value;
        render();
        const el = document.getElementById("q");
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      };
    }
  }

  render();
  setInterval(() => {
    if (state.speed) {
      for (let i = 0; i < Math.max(1, Math.min(state.speed, 4)); i++) step();
    }
  }, 900);
})();
