// Synthesized SFX via Web Audio API. No external assets.
let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = (window.AudioContext || (window as any).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function blip(freq: number, start: number, dur = 0.14, type: OscillatorType = "triangle", vol = 0.18) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  // Ingreso: ascending happy arpeggio
  ingreso() {
    blip(523.25, 0, 0.12);
    blip(659.25, 0.08, 0.12);
    blip(783.99, 0.16, 0.16);
    blip(1046.5, 0.24, 0.22, "sine");
  },
  // Retiro: quick clean double confirm
  retiro() {
    blip(880, 0, 0.08, "square", 0.12);
    blip(1174.66, 0.09, 0.1, "square", 0.12);
  },
  // Rendimiento: cash register / achievement
  rendimiento() {
    blip(659.25, 0, 0.1, "triangle");
    blip(880, 0.08, 0.1, "triangle");
    blip(1318.51, 0.18, 0.14, "sine", 0.2);
    blip(1760, 0.28, 0.22, "sine", 0.22);
    // sparkle
    blip(2637, 0.42, 0.18, "sine", 0.12);
  },
  error() {
    blip(220, 0, 0.18, "sawtooth", 0.14);
    blip(165, 0.1, 0.22, "sawtooth", 0.14);
  },
};
