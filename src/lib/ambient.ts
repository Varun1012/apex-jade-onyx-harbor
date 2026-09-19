export type AmbientHandle = {
  start: () => Promise<void>;
  stop: () => void;
  setMuted: (muted: boolean) => void;
};

const SRC = "/audio/market-ticker.mp3";

export function createAmbient(): AmbientHandle {
  let audio: HTMLAudioElement | null = null;
  let wantOn = false;
  let visBound = false;

  function ensure() {
    if (audio) return audio;
    audio = new Audio(SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.62;
    if (!visBound) {
      visBound = true;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && wantOn && audio) {
          void audio.play().catch(() => {});
        }
      });
    }
    return audio;
  }

  async function start() {
    wantOn = true;
    const el = ensure();
    el.muted = false;
    try {
      await el.play();
    } catch {
      /* autoplay blocked until a gesture */
    }
  }

  function stop() {
    wantOn = false;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  function setMuted(muted: boolean) {
    wantOn = !muted;
    if (!audio) {
      if (!muted) void start();
      return;
    }
    if (muted) {
      audio.pause();
      return;
    }
    void audio.play().catch(() => {});
  }

  return { start, stop, setMuted };
}
