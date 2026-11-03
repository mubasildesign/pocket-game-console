const CUES = {
  move: { notes: [180], dur: 0.028, gain: 0.07 },
  rotate: { notes: [523], dur: 0.04, gain: 0.07 },
  lock: { notes: [108], dur: 0.07, gain: 0.09 },
  clear: { notes: [523, 659, 784, 1046], dur: 0.07, step: 0.065, gain: 0.07 },
  score: { notes: [880], dur: 0.02, gain: 0.045 },
  hit: { notes: [196, 130], dur: 0.06, step: 0.05, gain: 0.08 },
  crash: { noise: true, notes: [220, 90], dur: 0.09, step: 0.05, gain: 0.1 },
  over: { notes: [494, 370, 277, 185], dur: 0.16, step: 0.15, gain: 0.08 },
  level: { notes: [523, 659, 784, 880, 1046], dur: 0.06, step: 0.055, gain: 0.07 },
  menu: { notes: [330], dur: 0.028, gain: 0.05 },
  confirm: { notes: [440, 660], dur: 0.06, step: 0.055, gain: 0.07 },
  power: { notes: [262, 392, 523], dur: 0.08, step: 0.07, gain: 0.08 },
  pause: { notes: [294], dur: 0.07, gain: 0.06 },
  catch: { notes: [660, 880, 1180], dur: 0.05, step: 0.045, gain: 0.07 },
};

export function createAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = 0.42;
  master.connect(ctx.destination);

  let muted = false;
  let engineHz = 0;
  let engineAcc = 0;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function unlock() {
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, dur, gain, when, wave = 'square') {
    const t = when ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(Math.max(40, freq), t);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(amp);
    amp.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, gain, when) {
    const t = when ?? ctx.currentTime;
    const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    const amp = ctx.createGain();
    src.buffer = buffer;
    amp.gain.setValueAtTime(gain, t);
    src.connect(amp);
    amp.connect(master);
    src.start(t);
  }

  function play(name, opts = {}) {
    if (muted) return;
    const cue = CUES[name];
    if (!cue) return;
    unlock();
    const motif = opts.motif || 1;
    const glass = opts.era === 'glass' && !reduce;
    const step = cue.step || 0;
    const now = ctx.currentTime + 0.005;
    if (cue.noise) noise(0.12, cue.gain, now);
    cue.notes.forEach((freq, i) => {
      const f = freq * motif;
      const at = now + i * step;
      tone(f, cue.dur, cue.gain, at);
      if (glass) {
        tone(f * 1.5, cue.dur * 0.8, cue.gain * 0.35, at + 0.045);
        const wob = ctx.createOscillator();
        const amp = ctx.createGain();
        wob.type = 'square';
        wob.frequency.setValueAtTime(f * 0.5, at);
        wob.frequency.linearRampToValueAtTime(f * 0.5 * 1.12, at + cue.dur);
        amp.gain.setValueAtTime(cue.gain * 0.25, at);
        amp.gain.exponentialRampToValueAtTime(0.0008, at + cue.dur);
        wob.connect(amp);
        amp.connect(master);
        wob.start(at);
        wob.stop(at + cue.dur + 0.02);
      }
    });
  }

  function engine(hz) {
    engineHz = hz > 0 ? hz : 0;
    if (!engineHz) engineAcc = 0;
  }

  function update(dt) {
    if (!engineHz || muted) return;
    engineAcc += dt;
    const step = 1 / engineHz;
    if (engineAcc >= step) {
      engineAcc %= step;
      tone(92, 0.018, 0.05);
    }
  }

  function toggle() {
    muted = !muted;
    master.gain.value = muted ? 0 : 0.42;
    if (!muted) unlock();
    return muted;
  }

  return {
    unlock,
    play,
    engine,
    update,
    toggle,
    get muted() {
      return muted;
    },
  };
}
