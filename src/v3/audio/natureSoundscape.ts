import type { AmbientMode } from "../domain";

const SILENCE = 0.0001;
const DEFAULT_VOLUME = 0.32;
const MAX_OUTPUT_GAIN = 0.18;
const CROSSFADE_SECONDS = 0.72;
const PARAM_RAMP_SECONDS = 0.28;
const STOP_FADE_SECONDS = 0.42;

type AudioContextConstructor = new () => AudioContext;

interface WebkitAudioWindow extends Window {
  webkitAudioContext?: AudioContextConstructor;
}

interface ModeGraph {
  readonly mode: AmbientMode;
  readonly output: GainNode;
  readonly nodes: Set<AudioNode>;
  readonly sources: Set<AudioScheduledSourceNode>;
}

export interface NatureSoundscape {
  start(mode: AmbientMode, volume?: number, muted?: boolean): Promise<void>;
  setMode(mode: AmbientMode): void;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  suspend(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;
}

let sharedContext: AudioContext | null = null;
let sharedNoiseBuffer: AudioBuffer | null = null;

export function createNatureSoundscape(): NatureSoundscape {
  return new RecordedNatureSoundscape();
}

const OCEAN_AUDIO_URL = `${import.meta.env.BASE_URL}audio/gentle-ocean-waves.mp3`;

class RecordedNatureSoundscape implements NatureSoundscape {
  private procedural = new ProceduralNatureSoundscape();
  private audio: HTMLAudioElement | null = null;
  private mode: AmbientMode = "ocean";
  private volume = DEFAULT_VOLUME;
  private muted = false;
  private active = false;
  private generation = 0;
  private fadeTimer: number | null = null;

  async start(mode: AmbientMode, volume = DEFAULT_VOLUME, muted = false): Promise<void> {
    this.active = true; this.mode = mode; this.volume = normaliseVolume(volume); this.muted = muted;
    const generation = ++this.generation;
    if (mode === "rain") { await this.stopRecorded(); await this.procedural.start("rain", volume, muted); return; }
    await this.procedural.stop();
    if (typeof Audio === "undefined" || navigator.userAgent.includes("jsdom")) { await this.procedural.start("ocean", volume, muted); return; }
    const audio = this.audio ?? new Audio(OCEAN_AUDIO_URL);
    this.audio = audio; audio.preload = "metadata"; audio.loop = false; audio.muted = muted; audio.volume = 0;
    try {
      audio.currentTime = 0;
      const playback = audio.play();
      if (!playback || typeof playback.then !== "function") throw new Error("Recorded audio playback is unavailable.");
      await playback;
      if (generation !== this.generation || !this.active) { await this.stopRecorded(); return; }
      this.fadeRecordedTo(muted ? 0 : this.volume, 500);
    } catch {
      await this.stopRecorded();
      if (generation === this.generation && this.active) await this.procedural.start("ocean", volume, muted);
    }
  }

  setMode(mode: AmbientMode): void { if (mode === this.mode) return; this.mode = mode; if (!this.active) return; if (typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom")) this.procedural.setMode(mode); else void this.start(mode, this.volume, this.muted); }
  setMuted(muted: boolean): void { this.muted = muted; if (this.audio && !this.audio.paused) { this.audio.muted = muted; this.fadeRecordedTo(muted ? 0 : this.volume, 220); } this.procedural.setMuted(muted); }
  setVolume(volume: number): void { this.volume = normaliseVolume(volume); this.fadeRecordedTo(this.muted ? 0 : this.volume, 180); this.procedural.setVolume(volume); }
  async suspend(): Promise<void> { if (this.audio && !this.audio.paused) this.audio.pause(); await this.procedural.suspend(); }
  async resume(): Promise<void> { if (this.active && this.mode === "ocean" && this.audio) { try { await this.audio.play(); } catch { await this.procedural.start("ocean", this.volume, this.muted); } } else await this.procedural.resume(); }
  async stop(): Promise<void> { this.active = false; this.generation += 1; await this.stopRecorded(); await this.procedural.stop(); }
  async destroy(): Promise<void> { await this.stop(); this.audio = null; await this.procedural.destroy(); }

  private fadeRecordedTo(target: number, milliseconds: number): void {
    const audio = this.audio; if (!audio) return; if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
    const start = audio.volume; const began = performance.now(); const safeTarget = Math.min(0.8, Math.max(0, target));
    this.fadeTimer = window.setInterval(() => { const t = Math.min(1, (performance.now() - began) / milliseconds); audio.volume = start + (safeTarget - start) * t; if (t >= 1 && this.fadeTimer !== null) { window.clearInterval(this.fadeTimer); this.fadeTimer = null; } }, 25);
  }
  private async stopRecorded(): Promise<void> { const audio = this.audio; if (!audio) return; this.fadeRecordedTo(0, 320); await delay(330); audio.pause(); try { audio.currentTime = 0; } catch { /* metadata may not be loaded */ } }
}

class ProceduralNatureSoundscape implements NatureSoundscape {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private activeGraph: ModeGraph | null = null;
  private retiringGraphs = new Set<ModeGraph>();
  private timers = new Set<number>();
  private volume = DEFAULT_VOLUME;
  private muted = false;
  private desiredActive = false;
  private lifecycleSuspended = false;
  private destroyed = false;
  private generation = 0;

  async start(mode: AmbientMode, volume = DEFAULT_VOLUME, muted = false): Promise<void> {
    if (this.destroyed) return;
    this.desiredActive = true;
    this.lifecycleSuspended = false;
    this.volume = normaliseVolume(volume);
    this.muted = muted;
    const generation = ++this.generation;
    const context = getSharedAudioContext();
    if (!context) return;
    this.context = context;
    await safelyResume(context);
    if (generation !== this.generation || !this.desiredActive || this.destroyed) return;
    if (!this.master) {
      const master = context.createGain();
      master.gain.setValueAtTime(SILENCE, context.currentTime);
      master.connect(context.destination);
      this.master = master;
    }
    if (!this.activeGraph || this.activeGraph.mode !== mode) this.crossfadeTo(mode);
    this.rampMaster();
  }

  setMode(mode: AmbientMode): void {
    if (!this.context || !this.master || !this.desiredActive || this.activeGraph?.mode === mode) return;
    this.crossfadeTo(mode);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.rampMaster();
  }

  setVolume(volume: number): void {
    this.volume = normaliseVolume(volume);
    this.rampMaster();
  }

  async suspend(): Promise<void> {
    this.lifecycleSuspended = true;
    const generation = ++this.generation;
    this.rampMaster();
    await delay(PARAM_RAMP_SECONDS * 1000);
    const context = this.context;
    if (!context || generation !== this.generation || !this.lifecycleSuspended) return;
    await safelySuspend(context);
  }

  async resume(): Promise<void> {
    const context = this.context;
    if (!context || !this.desiredActive || this.destroyed) return;
    this.lifecycleSuspended = false;
    const generation = ++this.generation;
    await safelyResume(context);
    if (generation !== this.generation || !this.desiredActive || this.destroyed) return;
    this.rampMaster();
  }

  async stop(): Promise<void> {
    this.desiredActive = false;
    this.lifecycleSuspended = false;
    this.generation += 1;
    const context = this.context;
    if (context && this.master) {
      rampParam(this.master.gain, SILENCE, context.currentTime, STOP_FADE_SECONDS);
      if (context.state === "running") await delay(STOP_FADE_SECONDS * 1000);
    }
    this.clearTimers();
    if (this.activeGraph) this.disposeGraph(this.activeGraph);
    this.activeGraph = null;
    this.retiringGraphs.forEach((graph) => this.disposeGraph(graph));
    this.retiringGraphs.clear();
    if (this.master) {
      safelyDisconnect(this.master);
      this.master = null;
    }
    if (context?.state === "running") await safelySuspend(context);
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    await this.stop();
    this.context = null;
  }

  private crossfadeTo(mode: AmbientMode): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;
    const now = context.currentTime;
    const next = createModeGraph(context, master, mode);
    rampParam(next.output.gain, 1, now, CROSSFADE_SECONDS);
    const previous = this.activeGraph;
    this.activeGraph = next;
    if (!previous) return;
    this.retiringGraphs.add(previous);
    rampParam(previous.output.gain, SILENCE, now, CROSSFADE_SECONDS);
    const timer = window.setTimeout(() => {
      this.timers.delete(timer);
      this.retiringGraphs.delete(previous);
      this.disposeGraph(previous);
    }, (CROSSFADE_SECONDS + 0.08) * 1000);
    this.timers.add(timer);
  }

  private rampMaster(): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;
    const target = !this.desiredActive || this.lifecycleSuspended || this.muted
      ? SILENCE
      : Math.max(SILENCE, this.volume * MAX_OUTPUT_GAIN);
    rampParam(master.gain, target, context.currentTime, PARAM_RAMP_SECONDS);
  }

  private disposeGraph(graph: ModeGraph): void {
    const stopAt = this.context?.currentTime ?? 0;
    graph.sources.forEach((source) => safelyStop(source, stopAt));
    graph.sources.clear();
    graph.nodes.forEach(safelyDisconnect);
    graph.nodes.clear();
  }

  private clearTimers(): void {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers.clear();
  }
}

function createModeGraph(context: AudioContext, destination: AudioNode, mode: AmbientMode): ModeGraph {
  const nodes = new Set<AudioNode>();
  const sources = new Set<AudioScheduledSourceNode>();
  const remember = <T extends AudioNode>(node: T): T => {
    nodes.add(node);
    return node;
  };
  const now = context.currentTime;
  const output = remember(context.createGain());
  output.gain.setValueAtTime(SILENCE, now);
  output.connect(destination);

  const noise = remember(context.createBufferSource());
  noise.buffer = getNoiseBuffer(context);
  noise.loop = true;
  sources.add(noise);

  if (mode === "ocean") {
    const low = remember(context.createBiquadFilter());
    const body = remember(context.createBiquadFilter());
    const texture = remember(context.createGain());
    const swell = remember(context.createGain());
    const lfo = remember(context.createOscillator());
    const lfoDepth = remember(context.createGain());
    low.type = "lowpass";
    low.frequency.setValueAtTime(820, now);
    low.Q.setValueAtTime(0.42, now);
    body.type = "bandpass";
    body.frequency.setValueAtTime(230, now);
    body.Q.setValueAtTime(0.7, now);
    texture.gain.setValueAtTime(0.16, now);
    swell.gain.setValueAtTime(0.055, now);
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.075, now);
    lfoDepth.gain.setValueAtTime(0.021, now);
    noise.connect(low);
    low.connect(body);
    body.connect(texture);
    texture.connect(swell);
    swell.connect(output);
    lfo.connect(lfoDepth);
    lfoDepth.connect(swell.gain);
    sources.add(lfo);
  } else {
    const high = remember(context.createBiquadFilter());
    const soft = remember(context.createBiquadFilter());
    const bed = remember(context.createGain());
    const fine = remember(context.createBiquadFilter());
    const fineGain = remember(context.createGain());
    high.type = "highpass";
    high.frequency.setValueAtTime(920, now);
    high.Q.setValueAtTime(0.32, now);
    soft.type = "lowpass";
    soft.frequency.setValueAtTime(5_200, now);
    soft.Q.setValueAtTime(0.28, now);
    bed.gain.setValueAtTime(0.052, now);
    fine.type = "bandpass";
    fine.frequency.setValueAtTime(2_450, now);
    fine.Q.setValueAtTime(0.62, now);
    fineGain.gain.setValueAtTime(0.016, now);
    noise.connect(high);
    high.connect(soft);
    soft.connect(bed);
    bed.connect(output);
    noise.connect(fine);
    fine.connect(fineGain);
    fineGain.connect(output);
  }

  sources.forEach((source) => source.start(now + 0.02));
  return { mode, output, nodes, sources };
}

function getSharedAudioContext(): AudioContext | null {
  if (sharedContext && sharedContext.state !== "closed") return sharedContext;
  if (typeof window === "undefined") return null;
  const audioWindow = window as WebkitAudioWindow;
  const Constructor = window.AudioContext ?? audioWindow.webkitAudioContext;
  if (!Constructor) return null;
  try {
    sharedContext = new Constructor();
    sharedNoiseBuffer = null;
    return sharedContext;
  } catch {
    return null;
  }
}

function getNoiseBuffer(context: AudioContext): AudioBuffer {
  if (sharedNoiseBuffer && sharedNoiseBuffer.sampleRate === context.sampleRate) return sharedNoiseBuffer;
  const length = Math.max(2_048, Math.floor(context.sampleRate * 12));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let state = 0x6d2b79f5;
  for (let index = 0; index < length; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    samples[index] = ((state >>> 0) / 2_147_483_648) - 1;
  }
  sharedNoiseBuffer = buffer;
  return buffer;
}

function rampParam(param: AudioParam, target: number, now: number, duration: number): void {
  try {
    param.cancelScheduledValues(now);
    param.setValueAtTime(Math.max(SILENCE, param.value), now);
    param.exponentialRampToValueAtTime(Math.max(SILENCE, target), now + duration);
  } catch {
    try {
      param.value = target;
    } catch {
      // Audio failure must never make the visual experience unusable.
    }
  }
}

function normaliseVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VOLUME;
  return Math.max(0, Math.min(0.8, value));
}

function safelyDisconnect(node: AudioNode): void {
  try {
    node.disconnect();
  } catch {
    // Already disconnected.
  }
}

function safelyStop(source: AudioScheduledSourceNode, at?: number): void {
  try {
    source.stop(at);
  } catch {
    // Already stopped or never started.
  }
}

async function safelyResume(context: AudioContext): Promise<void> {
  if (context.state !== "suspended") return;
  try {
    await context.resume();
  } catch {
    // The app stays silent if a browser rejects audio.
  }
}

async function safelySuspend(context: AudioContext): Promise<void> {
  if (context.state !== "running") return;
  try {
    await context.suspend();
  } catch {
    // Suspension is best effort.
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
