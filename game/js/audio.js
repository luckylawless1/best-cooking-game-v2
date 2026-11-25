// audio.js — every sound in the game, synthesised live with WebAudio.
// One job: make noise. No audio files, nothing fetched, fully offline.

export class SoundBoard {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  // Short filtered-noise burst, the workhorse for chops, sizzles and pops.
  burst({ freq = 1200, dur = 0.12, gain = 0.25, type = 'bandpass', q = 1 } = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(this.ctx.destination);
    src.start(t);
  }

  // A clean sine tone with a quick decay, for dings and ticks.
  tone({ freq = 660, dur = 0.18, gain = 0.22, slideTo = null } = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  chop() { this.burst({ freq: 900, dur: 0.09, gain: 0.35, type: 'lowpass' }); }
  pop() { this.burst({ freq: 2400, dur: 0.05, gain: 0.2 }); this.tone({ freq: 520, dur: 0.08, gain: 0.15 }); }
  place() { this.tone({ freq: 340, dur: 0.1, gain: 0.18, slideTo: 260 }); }
  fryDrop() { this.burst({ freq: 3200, dur: 0.25, gain: 0.2, type: 'highpass' }); }
  readyDing() { this.tone({ freq: 880, dur: 0.12, gain: 0.2 }); this.tone({ freq: 1318, dur: 0.2, gain: 0.18 }); }
  serveDing() {
    this.tone({ freq: 523, dur: 0.12, gain: 0.22 });
    setTimeout(() => this.tone({ freq: 784, dur: 0.22, gain: 0.22 }), 90);
  }
  errorBuzz() { this.tone({ freq: 160, dur: 0.25, gain: 0.25, slideTo: 110 }); }
  tick() { this.tone({ freq: 1100, dur: 0.05, gain: 0.12 }); }
  burnAlarm() { this.tone({ freq: 220, dur: 0.3, gain: 0.2, slideTo: 180 }); }
  rushHorn() {
    this.tone({ freq: 392, dur: 0.15, gain: 0.22 });
    setTimeout(() => this.tone({ freq: 523, dur: 0.3, gain: 0.22 }), 130);
  }

  // Looping grill sizzle while any patty, egg or fries is cooking.
  startSizzle() {
    if (!this.ctx || this.muted || this.sizzleNodes) return;
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4200;
    filter.Q.value = 0.6;
    const g = this.ctx.createGain();
    g.gain.value = 0.05;
    src.connect(filter).connect(g).connect(this.ctx.destination);
    src.start();
    this.sizzleNodes = { src, g };
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try { this.sizzleNodes.src.stop(); } catch (e) { /* already stopped */ }
    this.sizzleNodes = null;
  }
}
