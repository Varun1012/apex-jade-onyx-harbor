export type AmbientHandle = {
  start: () => Promise<void>;
  stop: () => void;
  setMuted: (muted: boolean) => void;
};

const BPM = 78;
const BEAT = 60 / BPM;

function noiseBuffer(ctx: AudioContext, seconds: number, color: "white" | "pink"): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (color === "pink") {
      b0 = 0.97 * b0 + 0.03 * w;
      d[i] = b0 * 3.2;
    } else d[i] = w;
  }
  return buf;
}

function envGain(ctx: AudioContext, dest: AudioNode, t: number, peak: number, a: number, d: number) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  g.connect(dest);
  return g;
}

function kick(ctx: AudioContext, dest: AudioNode, t: number) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  const g = envGain(ctx, dest, t, 0.22, 0.004, 0.22);
  osc.connect(g);
  osc.start(t);
  osc.stop(t + 0.28);
}

function snare(ctx: AudioContext, dest: AudioNode, t: number, noise: AudioBuffer) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800;
  bp.Q.value = 0.8;
  const g = envGain(ctx, dest, t, 0.11, 0.003, 0.12);
  src.connect(bp);
  bp.connect(g);
  const tone = ctx.createOscillator();
  tone.type = "triangle";
  tone.frequency.value = 180;
  const tg = envGain(ctx, dest, t, 0.04, 0.002, 0.08);
  tone.connect(tg);
  src.start(t);
  src.stop(t + 0.16);
  tone.start(t);
  tone.stop(t + 0.14);
}

function hat(ctx: AudioContext, dest: AudioNode, t: number, noise: AudioBuffer, open: boolean) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7000;
  const g = envGain(ctx, dest, t, open ? 0.045 : 0.028, 0.001, open ? 0.18 : 0.04);
  src.connect(hp);
  hp.connect(g);
  src.start(t);
  src.stop(t + (open ? 0.2 : 0.06));
}

function rhodes(ctx: AudioContext, dest: AudioNode, t: number, freq: number, dur: number, peak: number) {
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
  const g = envGain(ctx, dest, t, peak, 0.02, dur);
  car.connect(lp);
  lp.connect(g);
  car.start(t);
  mod.start(t);
  car.stop(t + dur + 0.05);
  mod.stop(t + dur + 0.05);
}

function bass(ctx: AudioContext, dest: AudioNode, t: number, freq: number) {
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = freq;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 280;
  const g = envGain(ctx, dest, t, 0.16, 0.01, 0.38);
  osc.connect(lp);
  lp.connect(g);
  osc.start(t);
  osc.stop(t + 0.45);
}

const CHORDS: number[][] = [
  [220.0, 261.63, 329.63, 392.0],
  [146.83, 174.61, 220.0, 293.66],
  [196.0, 246.94, 293.66, 349.23],
  [130.81, 164.81, 196.0, 246.94],
];
const ROOTS = [110.0, 146.83, 98.0, 130.81];

export function createAmbient(): AmbientHandle {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let vinyl: AudioBufferSourceNode | null = null;
  let timer = 0;
  let nextBeat = 0;
  let beatIndex = 0;
  let white: AudioBuffer | null = null;
  let wow: OscillatorNode | null = null;

  function scheduleBar() {
    const ac = ctx;
    const bus = master;
    const nbuf = white;
    if (!ac || !bus || !nbuf) return;
    const look = 0.35;
    while (nextBeat < ac.currentTime + look) {
      const t = nextBeat;
      const i = beatIndex % 16;
      const chord = CHORDS[Math.floor(beatIndex / 16) % CHORDS.length]!;
      const root = ROOTS[Math.floor(beatIndex / 16) % ROOTS.length]!;
      const swing = i % 2 === 1 ? BEAT * 0.16 : 0;

      if (i % 4 === 0) kick(ac, bus, t);
      if (i % 4 === 2) snare(ac, bus, t, nbuf);
      hat(ac, bus, t + swing, nbuf, i % 8 === 7);
      if (i % 4 === 0) {
        chord.forEach((f, n) => rhodes(ac, bus, t, f, 1.55, n === 0 ? 0.05 : 0.038));
        bass(ac, bus, t, root / 2);
      }
      if (i % 16 === 6) rhodes(ac, bus, t + swing, chord[2]! * 2, 0.55, 0.03);
      if (i % 16 === 10) rhodes(ac, bus, t + swing, chord[1]! * 2, 0.4, 0.024);

      nextBeat += BEAT;
      beatIndex += 1;
    }
  }

  async function start() {
    if (ctx) {
      if (ctx.state === "suspended") await ctx.resume();
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.2;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1650;
    filter.Q.value = 0.4;
    wow = ctx.createOscillator();
    const wowG = ctx.createGain();
    wow.type = "sine";
    wow.frequency.value = 0.12;
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
    vG.gain.value = 0.035;
    vinyl.connect(vHp);
    vHp.connect(vLp);
    vLp.connect(vG);
    vG.connect(master);
    vinyl.start();

    beatIndex = 0;
    nextBeat = ctx.currentTime + 0.05;
    scheduleBar();
    timer = window.setInterval(scheduleBar, 80);
  }

  function stop() {
    window.clearInterval(timer);
    timer = 0;
    try {
      vinyl?.stop();
      wow?.stop();
    } catch {
      /* already stopped */
    }
    vinyl = null;
    wow = null;
    white = null;
    void ctx?.close();
    ctx = null;
    master = null;
  }

  function setMuted(muted: boolean) {
    if (!master || !ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(muted ? 0 : 0.2, ctx.currentTime + 0.25);
  }

  return { start, stop, setMuted };
}
