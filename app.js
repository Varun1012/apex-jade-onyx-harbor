const START = 10000, GOAL = 1e8;
const UNIVERSE = [
  { s:"HSI", n:"恒生指數迷你", k:"index", start:25842, vol:0.012, beta:1, pv:1, lev:10 },
  { s:"2800", n:"盈富基金", k:"etf", start:25.84, vol:0.01, beta:1, pv:1, lev:1 },
  { s:"0005", n:"匯豐控股", start:88.45, vol:0.011, beta:0.85, pv:1, lev:5 },
  { s:"0700", n:"騰訊控股", start:412.6, vol:0.018, beta:1.25, pv:1, lev:5 },
  { s:"9988", n:"阿里巴巴", start:92.15, vol:0.02, beta:1.3, pv:1, lev:5 },
  { s:"3690", n:"美團", start:118.3, vol:0.024, beta:1.35, pv:1, lev:5 },
  { s:"1810", n:"小米集團", start:48.75, vol:0.026, beta:1.4, pv:1, lev:5 },
  { s:"0941", n:"中國移動", start:76.2, vol:0.009, beta:0.55, pv:1, lev:2 },
  { s:"1299", n:"友邦保險", start:68.9, vol:0.013, beta:0.9, pv:1, lev:5 },
  { s:"0388", n:"港交所", start:352.4, vol:0.016, beta:1.1, pv:1, lev:5 },
  { s:"2318", n:"中國平安", start:47.85, vol:0.017, beta:1.05, pv:1, lev:5 },
  { s:"1211", n:"比亞迪股份", start:268, vol:0.022, beta:1.2, pv:1, lev:5 },
  { s:"0434", n:"博雅互動", start:5.18, vol:0.038, beta:1.15, pv:1, lev:5 },
  { s:"3988", n:"中國銀行", start:4.21, vol:0.01, beta:0.72, pv:1, lev:2 },
  { s:"9618", n:"京東集團", start:128.5, vol:0.023, beta:1.28, pv:1, lev:5 },
  { s:"9999", n:"網易", start:154.8, vol:0.019, beta:1.15, pv:1, lev:5 },
];
const BY = Object.fromEntries(UNIVERSE.map(i => [i.s, i]));

function gauss(){ let u=0,v=0; while(!u)u=Math.random(); while(!v)v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function tickSize(p){ if(p<10)return 0.01; if(p<50)return 0.05; if(p<100)return 0.1; if(p<200)return 0.2; if(p<500)return 0.5; if(p<2000)return 1; return 5; }
function rnd(p, inst){ const t = inst.k==="index"?1:tickSize(p); return Math.max(t, Math.round(p/t)*t); }
function fmtH(n){ const a=Math.abs(n), s=n<0?"−":""; if(a>=1e7) return s+"HK$"+(a/1e6).toFixed(2)+"M"; return s+"HK$"+a.toLocaleString("en-HK",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtP(n){ return n>=1000?n.toFixed(1):n>=10?n.toFixed(2):n.toFixed(3); }
function fmtPct(n){ return (n>0?"+":n<0?"−":"")+(Math.abs(n)*100).toFixed(2)+"%"; }

function seedQuotes(){
  const q={};
  for(const i of UNIVERSE){ const last=rnd(i.start,i); const t=i.k==="index"?1:tickSize(last); q[i.s]={last,bid:last-t,ask:last+t,prev:last,o:last,h:last,l:last}; }
  return q;
}
function seedCandles(quotes){
  const book={};
  for(const i of UNIVERSE){
    let p=quotes[i.s].last; const d=[], m15=[], m5=[];
    for(let k=70;k>=0;k--){ p=Math.max(i.start*0.5, p*(1+gauss()*i.vol*0.4)); const c=rnd(p,i); const o=rnd(c*(1+(Math.random()-0.5)*0.01),i); d.push({o,h:Math.max(o,c),l:Math.min(o,c),c}); }
    p=quotes[i.s].last;
    for(let k=64;k>=0;k--){ p=Math.max(i.start*0.5, p*(1+gauss()*i.vol*0.25)); const c=rnd(p,i); const o=rnd(c*(1+(Math.random()-0.5)*0.006),i); m15.push({o,h:Math.max(o,c),l:Math.min(o,c),c}); }
    p=quotes[i.s].last;
    for(let k=72;k>=0;k--){ p=Math.max(i.start*0.5, p*(1+gauss()*i.vol*0.18)); const c=rnd(p,i); const o=rnd(c*(1+(Math.random()-0.5)*0.004),i); m5.push({o,h:Math.max(o,c),l:Math.min(o,c),c}); }
    book[i.s]={"1d":d,"15m":m15,"5m":m5};
  }
  return book;
}
function sma(arr,n){ if(arr.length<n) return null; return arr.slice(-n).reduce((a,b)=>a+b,0)/n; }
function rsi(cl,n=14){ if(cl.length<n+1) return null; let g=0,l=0; for(let i=cl.length-n;i<cl.length;i++){ const d=cl[i]-cl[i-1]; if(d>=0)g+=d; else l-=d; } if(!l) return 100; const rs=g/l; return 100-100/(1+rs); }
function hints(cs){
  const cl=cs.map(c=>c.c); const last=cl.at(-1); const m20=sma(cl,Math.min(20,cl.length)); const r=rsi(cl); const out=[];
  if(m20!=null){ out.push(last>m20*1.004?["up","價格在 SMA20 之上","短線結構偏多，回踩均線可觀察承接。"]: last<m20*0.996?["down","價格在 SMA20 之下","短線結構偏空，反彈至均線或遇阻力。"]:["neu","貼近均線","方向未明，等下一根確認。"]); }
  if(r!=null){ out.push(r>=70?["down","RSI "+r.toFixed(0)+" 超買","升勢或過熱，宜防回吐。"]: r<=30?["up","RSI "+r.toFixed(0)+" 超賣","跌勢或過急，需等陽燭確認。"]:["neu","RSI "+r.toFixed(0)+" 中性","動能未極端。"]); }
  const b=cs.at(-1); if(b){ const body=Math.abs(b.c-b.o), rng=b.h-b.l||1e-9; if(body/rng<0.12) out.unshift(["neu","十字星","多空平衡，常見於轉向觀察點。"]); }
  return out.slice(0,4);
}

const state = {
  cash: START, quotes: seedQuotes(), candles: null, pos: [], fills: [], news: "模擬開市。買入以賣出價成交，賣出以買入價成交。",
  sel: "0700", speed: 1, tf: "15m", qty: "1", lev: 1, music: false, won: false, busted: false, clock: Date.parse("2026-09-14T01:30:00+08:00"),
};
state.candles = seedCandles(state.quotes);

function equity(){
  return state.cash + state.pos.reduce((s,p)=>{
    const q=state.quotes[p.s]; const inst=BY[p.s]; const mtm=p.qty>0?q.bid:q.ask;
    const pnl=(mtm-p.avg)*p.qty*inst.pv; const margin=Math.abs(p.qty)*p.avg*inst.pv/p.lev;
    return s+margin+pnl;
  },0);
}

function step(){
  if(!state.speed || state.won || state.busted) return;
  const shock=gauss()*0.0018;
  for(const i of UNIVERSE){
    if(i.s==="HSI") continue;
    const q=state.quotes[i.s];
    const raw=q.last*(1+shock*i.beta+gauss()*i.vol*0.18);
    const last=rnd(raw,i); const t=tickSize(last);
    q.last=last; q.bid=last-t; q.ask=last+t; q.h=Math.max(q.h,last); q.l=Math.min(q.l,last);
    pushC(i.s,last);
  }
  const hsi=UNIVERSE.filter(i=>i.s!=="HSI"&&i.s!=="2800").reduce((s,i)=>s+state.quotes[i.s].last/i.start,0);
  const avg=hsi/(UNIVERSE.length-2); const H=BY.HSI; const hl=rnd(H.start*avg*(1+gauss()*0.002),H);
  const hq=state.quotes.HSI; hq.last=hl; hq.bid=hl-1; hq.ask=hl+1; pushC("HSI",hl);
  const etf=rnd(hl/1000, BY["2800"]); const eq=state.quotes["2800"]; eq.last=etf; eq.bid=etf-0.01; eq.ask=etf+0.01; pushC("2800",etf);
  state.clock += 60000;
  if(Math.random()<0.03) state.news = ["北水淨流入","科網股回吐","銀行股偏穩","博雅交投轉旺","中行息差穩定"][Math.floor(Math.random()*5)];
  const eqy=equity(); if(eqy>=GOAL) state.won=true; if(eqy<=0) state.busted=true;
  render();
}
function pushC(sym, last){
  const book=state.candles[sym];
  for(const tf of ["5m","15m","1d"]){
    const arr=book[tf]; const c=arr.at(-1);
    if(c){ c.c=last; c.h=Math.max(c.h,last); c.l=Math.min(c.l,last); }
    if(tf!=="1d" && arr.length && arr.length% (tf==="5m"?5:15)===0) arr.push({o:last,h:last,l:last,c:last});
    if(arr.length>90) arr.shift();
  }
}

function place(side){
  const inst=BY[state.sel], q=state.quotes[state.sel];
  const qty=Math.max(0, Math.floor(+state.qty||0)); if(!qty) return alert("請輸入數量");
  const lev=Math.min(state.lev, inst.lev);
  const price=side==="buy"?q.ask:q.bid; const signed=side==="buy"?qty:-qty;
  const exist=state.pos.find(p=>p.s===state.sel);
  if(exist && Math.sign(exist.qty)!==Math.sign(signed)){
    const cq=Math.min(Math.abs(exist.qty), qty); const exit=exist.qty>0?q.bid:q.ask;
    const pnl=(exit-exist.avg)* (exist.qty>0?cq:-cq)*inst.pv;
    const margin=cq*exist.avg*inst.pv/exist.lev; state.cash += margin+pnl;
    exist.qty += exist.qty>0?-cq:cq; if(exist.qty===0) state.pos=state.pos.filter(p=>p!==exist);
    state.fills.unshift({side, s:state.sel, qty:cq, price:exit});
    render(); return;
  }
  const cost=qty*price*inst.pv/lev; if(cost>state.cash) return alert("現金不足");
  state.cash-=cost;
  if(exist && exist.lev===lev){ const nq=exist.qty+signed; exist.avg=(exist.avg*Math.abs(exist.qty)+price*qty)/Math.abs(nq); exist.qty=nq; }
  else if(exist) return alert("請先平倉再改槓桿");
  else state.pos.push({s:state.sel, qty:signed, avg:price, lev});
  state.fills.unshift({side, s:state.sel, qty, price});
  render();
}

let loFi=null;
function toggleMusic(){
  state.music=!state.music;
  if(state.music) startLofi(); else loFi && loFi.gain.gain.setValueAtTime(0, loFi.ctx.currentTime);
  render();
}
function startLofi(){
  if(loFi){ loFi.gain.gain.setValueAtTime(0.18, loFi.ctx.currentTime); loFi.ctx.resume(); return; }
  const ctx=new (window.AudioContext||window.webkitAudioContext)();
  const master=ctx.createGain(); master.gain.value=0.18;
  const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=1600; master.connect(lp); lp.connect(ctx.destination);
  const chords=[[220,261.63,329.63],[146.83,174.61,220],[196,246.94,293.66],[130.81,164.81,196]];
  let i=0, t=ctx.currentTime;
  function beat(){
    if(!state.music) return;
    const ch=chords[i%4];
    ch.forEach((f,n)=>{
      const o=ctx.createOscillator(), g=ctx.createGain(); o.type="sine"; o.frequency.value=f;
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(n?0.03:0.05,t+0.03); g.gain.exponentialRampToValueAtTime(0.0001,t+1.6);
      o.connect(g); g.connect(master); o.start(t); o.stop(t+1.7);
    });
    const k=ctx.createOscillator(), kg=ctx.createGain(); k.type="sine"; k.frequency.setValueAtTime(120,t); k.frequency.exponentialRampToValueAtTime(40,t+0.12);
    kg.gain.setValueAtTime(0.16,t); kg.gain.exponentialRampToValueAtTime(0.0001,t+0.2); k.connect(kg); kg.connect(master); k.start(t); k.stop(t+0.22);
    t+=60/78; i++; setTimeout(beat, 60/78*1000);
  }
  beat(); loFi={ctx, gain:master};
}

function drawChart(el, cs){
  const dpr=devicePixelRatio||1; const w=el.clientWidth, h=220;
  el.width=w*dpr; el.height=h*dpr; const ctx=el.getContext("2d"); ctx.setTransform(dpr,0,0,dpr,0,0);
  const data=cs.slice(-64); if(!data.length) return;
  let min=Math.min(...data.map(c=>c.l)), max=Math.max(...data.map(c=>c.h)); if(min===max){min*=0.99;max*=1.01;}
  const pad=46, plotW=w-pad-8, plotH=h-20, y=v=>10+(max-v)/(max-min)*plotH, slot=plotW/data.length;
  ctx.strokeStyle="#2a2d29"; ctx.fillStyle="#8b9188"; ctx.font="10px IBM Plex Mono"; ctx.textAlign="right";
  for(let i=0;i<4;i++){ const v=max-(max-min)*i/3; ctx.beginPath(); ctx.moveTo(pad,y(v)); ctx.lineTo(w-8,y(v)); ctx.stroke(); ctx.fillText(fmtP(v), pad-4, y(v)+3); }
  data.forEach((c,i)=>{
    const x=pad+slot*i+slot/2, up=c.c>=c.o, col=up?"#c4453c":"#2f8f6b";
    ctx.strokeStyle=col; ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x,y(c.h)); ctx.lineTo(x,y(c.l)); ctx.stroke();
    const top=y(Math.max(c.o,c.c)), bot=y(Math.min(c.o,c.c)); ctx.fillRect(x-Math.max(2,slot*0.3), top, Math.max(2,slot*0.6), Math.max(1,bot-top));
  });
}

function render(){
  const inst=BY[state.sel], q=state.quotes[state.sel], eq=equity(), pnl=eq-START, hsi=state.quotes.HSI;
  const hsich=(hsi.last-hsi.prev)/hsi.prev; const chg=(q.last-q.prev)/q.prev;
  const series=state.candles[state.sel][state.tf];
  const hs=hints(series);
  const $ = document.getElementById("app");
  $.innerHTML = `
    <header>
      <div class="row">
        <div><div class="kicker">Apex Jade · Paper Hang Seng</div><h1>港股模擬盤</h1></div>
        <div class="row">
          <div class="bar">${[0,1,4,12].map(s=>`<button class="${state.speed===s?"on":""}" data-speed="${s}">${s===0?"暫停":s+"x"}</button>`).join("")}</div>
          <button class="ghost" id="lofi">${state.music?"Lo-fi 開":"Lo-fi"}</button>
          <button class="ghost" id="reset">重開戶口</button>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><label>恒生指數</label><div class="v mono">${hsi.last.toLocaleString("en-HK")}</div><div class="${hsich>=0?"up":"down"}">${fmtPct(hsich)}</div></div>
        <div class="stat"><label>現金</label><div class="v mono">${fmtH(state.cash)}</div></div>
        <div class="stat"><label>總資產</label><div class="v mono">${fmtH(eq)}</div><div class="${pnl>=0?"up":"down"}">${fmtH(pnl)}</div></div>
        <div class="stat"><label>任務 1億</label><div class="progress"><i style="width:${Math.min(100,eq/GOAL*100)}%"></i></div></div>
      </div>
    </header>
    <div class="news">${state.news}</div>
    <main>
      <section>
        <input class="search" id="q" placeholder="搜尋代號 / 名稱" />
        <div class="list" id="list">${UNIVERSE.map(i=>{
          const qq=state.quotes[i.s]; const c=(qq.last-qq.prev)/qq.prev;
          return `<button class="row-item ${state.sel===i.s?"active":""}" data-s="${i.s}"><span class="mono">${i.s}</span><span>${i.n}</span><span class="mono ${c>=0?"up":"down"}">${fmtP(qq.last)}<br><small>${fmtPct(c)}</small></span></button>`;
        }).join("")}</div>
      </section>
      <section>
        <div class="muted mono">${inst.s}</div>
        <h2 style="margin:0 0 8px">${inst.n}</h2>
        <div class="mono" style="font-size:28px">${fmtP(q.last)} <span class="${chg>=0?"up":"down"}" style="font-size:14px">${fmtPct(chg)}</span></div>
        <div class="bar" style="margin:10px 0">${[["5m","5分鐘"],["15m","15分鐘"],["1d","日線"]].map(([id,l])=>`<button class="${state.tf===id?"on":""}" data-tf="${id}">${l}</button>`).join("")}</div>
        <canvas id="kline"></canvas>
        <div class="hints"><div class="muted">技術走勢提示 · 教學用途，非投資建議</div>${hs.map(h=>`<p class="${h[0]==="up"?"up":h[0]==="down"?"down":""}"><b>${h[1]}</b><br><span class="muted">${h[2]}</span></p>`).join("")}</div>
        <div class="bidask"><div class="bid">買入價 Bid（賣出成交）<div class="mono" style="font-size:20px">${fmtP(q.bid)}</div></div><div class="ask">賣出價 Ask（買入成交）<div class="mono" style="font-size:20px">${fmtP(q.ask)}</div></div></div>
        <label class="muted">數量<input class="qty" id="qty" value="${state.qty}" /></label>
        <div class="muted" style="margin-top:8px">槓桿（最高 ${inst.lev}x）</div>
        <div class="lev bar">${[1,2,5,10].filter(x=>x<=inst.lev).map(x=>`<button class="${state.lev===x?"on":""}" data-lev="${x}">${x}x</button>`).join("")}</div>
        <div class="actions"><button class="buy" id="buy">買入 @ ${fmtP(q.ask)}</button><button class="sell" id="sell">賣出 @ ${fmtP(q.bid)}</button></div>
      </section>
      <section>
        <h3>持倉</h3>
        ${state.pos.length?state.pos.map(p=>{
          const i=BY[p.s], qq=state.quotes[p.s], mtm=p.qty>0?qq.bid:qq.ask, pnl=(mtm-p.avg)*p.qty*i.pv;
          return `<div class="pos"><div>${i.n} <span class="muted mono">${p.s}</span></div><div class="muted">${p.qty>0?"好倉":"淡倉"} ${Math.abs(p.qty)} · 均價 ${fmtP(p.avg)} · ${p.lev}x</div><div class="${pnl>=0?"up":"down"}">${fmtH(pnl)}</div><button class="ghost" data-close="${p.s}">平倉</button></div>`;
        }).join(""):`<p class="muted">空倉。本金 ${fmtH(START)}，目標 ${fmtH(GOAL)}。</p>`}
        <h3>成交</h3>
        ${state.fills.slice(0,8).map(f=>`<div class="muted">${f.side==="buy"?"買入":"賣出"} ${f.s} ${f.qty} @ ${fmtP(f.price)}</div>`).join("")||`<p class="muted">尚未落盤。</p>`}
      </section>
    </main>
    ${state.won||state.busted?`<div class="modal"><div class="box"><div class="kicker">${state.won?"MISSION COMPLETE":"MARGIN CALL"}</div><h2>${state.won?"財富自由":"戶口爆倉"}</h2><p class="muted">${state.won?"總資產已達港幣一億。":"保證金已耗盡。"}</p><p class="mono">${fmtH(eq)}</p><button class="ghost" id="again">再來一局</button></div></div>`:""}
  `;
  const cnv=document.getElementById("kline"); if(cnv) drawChart(cnv, series);
  $.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{state.sel=b.dataset.s; state.lev=1; render();});
  $.querySelectorAll("[data-speed]").forEach(b=>b.onclick=()=>{state.speed=+b.dataset.speed; render();});
  $.querySelectorAll("[data-tf]").forEach(b=>b.onclick=()=>{state.tf=b.dataset.tf; render();});
  $.querySelectorAll("[data-lev]").forEach(b=>b.onclick=()=>{state.lev=+b.dataset.lev; render();});
  $.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>{ const p=state.pos.find(x=>x.s===b.dataset.close); if(!p)return; state.sel=p.s; state.qty=String(Math.abs(p.qty)); place(p.qty>0?"sell":"buy"); });
  const qin=document.getElementById("qty"); if(qin) qin.oninput=e=>state.qty=e.target.value.replace(/[^\d]/g,"");
  const buy=document.getElementById("buy"); if(buy) buy.onclick=()=>place("buy");
  const sell=document.getElementById("sell"); if(sell) sell.onclick=()=>place("sell");
  const lofi=document.getElementById("lofi"); if(lofi) lofi.onclick=toggleMusic;
  const reset=document.getElementById("reset"); if(reset) reset.onclick=hardReset;
  const again=document.getElementById("again"); if(again) again.onclick=hardReset;
  const search=document.getElementById("q"); if(search) search.oninput=e=>{
    const n=e.target.value.trim();
    document.querySelectorAll("#list .row-item").forEach(el=>{
      const s=el.dataset.s, name=BY[s].n; el.style.display=(!n||s.includes(n)||name.includes(n))?"":"none";
    });
  };
}
function hardReset(){ state.cash=START; state.quotes=seedQuotes(); state.candles=seedCandles(state.quotes); state.pos=[]; state.fills=[]; state.won=false; state.busted=false; state.news="戶口已重置。"; render(); }

render();
setInterval(()=>{ if(state.speed){ for(let i=0;i<state.speed;i++) step(); } }, 900);
