const MAX_OUTPUT_GAIN = 0.16;
const DEFAULT_VOLUME = 0.3;
const PARAM_RAMP_SECONDS = 0.28;
const STOP_FADE_SECONDS = 0.45;
const AMBIENT_ATTACK_SECONDS = 3.2;
const SILENCE = 0.0001;

type AudioContextConstructor = new () => AudioContext;

interface WebkitAudioWindow extends Window {
  webkitAudioContext?: AudioContextConstructor;
}

type BloomNote = {
  readonly offset: number;
  readonly frequency: number;
  readonly duration: number;
  readonly peakGain: number;
};

/**
 * A deliberately small, best-effort sound controller for the living world.
 * Every method is safe to call when Web Audio is unavailable or blocked.
 */
export interface AmbientSoundscape {
  start(volume: number, muted: boolean): Promise<void>;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  beginGrowth(): void;
  complete(): void;
  suspend(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;
}

export type AmbientSoundscapeFactory = () => AmbientSoundscape;

class ProceduralAmbientSoundscape implements AmbientSoundscape {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private warmthGain: GainNode | null = null;
  private readonly graphNodes = new Set<AudioNode>();
  private readonly continuousSources = new Set<AudioScheduledSourceNode>();
  private readonly transientSources = new Set<OscillatorNode>();
  private volume = DEFAULT_VOLUME;
  private muted = false;
  private graphActive = false;
  private growthActive = false;
  private destroyed = false;
  private desiredActive = false;
  private lifecycleSuspended = false;
  private operationGeneration = 0;
  private stopPending: Promise<void> | null = null;

  async start(volume: number, muted: boolean): Promise<void> {
    if (this.destroyed) return;

    this.desiredActive = true;
    this.lifecycleSuspended = false;
    const generation = ++this.operationGeneration;
    this.volume = normaliseVolume(volume);
    this.muted = muted;

    if (this.stopPending) {
      await this.stopPending;
      if (!this.isCurrentOperation(generation)) return;
    }

    const context = this.getOrCreateContext();
    if (!context) return;

    await safelyResume(context);
    if (!this.isCurrentOperation(generation) || this.context !== context) {
      await this.suspendIfInactive(context);
      return;
    }

    if (!this.graphActive) this.createAmbientGraph(context);
    this.rampMasterGain();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.rampMasterGain();
  }

  setVolume(volume: number): void {
    this.volume = normaliseVolume(volume);
    this.rampMasterGain();
  }

  beginGrowth(): void {
    const context = this.context;
    if (!this.desiredActive || !context || !this.graphActive || this.growthActive) return;

    this.growthActive = true;
    const now = context.currentTime;
    this.rampAudioParam(this.warmthGain?.gain, 0.86, now, 4.5);

    // An A-major pentatonic ascent follows the visual score from roots to crown.
    // Wide spacing and long releases keep it legato rather than melody-like.
    const growthNotes: readonly BloomNote[] = [
      { offset: 0.25, frequency: 220, duration: 2.4, peakGain: 0.028 },
      { offset: 2.9, frequency: 246.94, duration: 2.7, peakGain: 0.026 },
      { offset: 6.8, frequency: 277.18, duration: 2.9, peakGain: 0.024 },
      { offset: 10.9, frequency: 329.63, duration: 3, peakGain: 0.021 },
      { offset: 14.1, frequency: 369.99, duration: 3.2, peakGain: 0.018 },
    ];

    growthNotes.forEach((note) => {
      this.scheduleTonalBloom(context, note.frequency, now + note.offset, note.duration, note.peakGain);
    });
  }

  complete(): void {
    const context = this.context;
    if (!this.desiredActive || !context || !this.graphActive || !this.growthActive) return;

    this.growthActive = false;
    const now = context.currentTime;
    this.rampAudioParam(this.warmthGain?.gain, 0.72, now, 3.6);

    // A softly staggered A-major voicing settles the ascent without a bright alert sound.
    const completionNotes: readonly BloomNote[] = [
      { offset: 0.08, frequency: 220, duration: 3.8, peakGain: 0.018 },
      { offset: 0.18, frequency: 277.18, duration: 4, peakGain: 0.016 },
      { offset: 0.3, frequency: 329.63, duration: 4.2, peakGain: 0.014 },
    ];

    completionNotes.forEach((note) => {
      this.scheduleTonalBloom(context, note.frequency, now + note.offset, note.duration, note.peakGain);
    });
  }

  async suspend(): Promise<void> {
    this.lifecycleSuspended = true;
    const generation = ++this.operationGeneration;
    const context = this.context;
    if (!context || context.state !== "running") return;
    this.rampMasterGain();
    await delay(PARAM_RAMP_SECONDS * 1000);
    if (
      generation !== this.operationGeneration
      || !this.lifecycleSuspended
      || this.context !== context
    ) {
      return;
    }
    await safelySuspend(context);
  }

  async resume(): Promise<void> {
    const context = this.context;
    if (!context || this.destroyed || !this.desiredActive || !this.graphActive) return;

    this.lifecycleSuspended = false;
    const generation = ++this.operationGeneration;
    await safelyResume(context);
    if (!this.isCurrentOperation(generation) || this.context !== context) {
      await this.suspendIfInactive(context);
      return;
    }
    this.rampMasterGain();
  }

  async stop(): Promise<void> {
    this.desiredActive = false;
    this.lifecycleSuspended = false;
    this.operationGeneration += 1;
    if (this.stopPending) return this.stopPending;

    const pending = this.performStop();
    this.stopPending = pending;
    try {
      await pending;
    } finally {
      if (this.stopPending === pending) this.stopPending = null;
    }
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    await this.stop();

    const context = this.context;
    this.context = null;
    if (!context || context.state === "closed") return;

    try {
      await context.close();
    } catch {
      // Closing is best-effort; the UI must remain usable if a browser rejects it.
    }
  }

  private getOrCreateContext(): AudioContext | null {
    if (this.context) return this.context;
    const AudioContextClass = getAudioContextConstructor();
    if (!AudioContextClass) return null;

    try {
      this.context = new AudioContextClass();
      return this.context;
    } catch {
      return null;
    }
  }

  private createAmbientGraph(context: AudioContext): void {
    const createdSources: AudioScheduledSourceNode[] = [];

    try {
      const masterGain = this.rememberNode(context.createGain());
      const ambientGain = this.rememberNode(context.createGain());
      const warmthGain = this.rememberNode(context.createGain());
      const warmthFilter = this.rememberNode(context.createBiquadFilter());
      const now = context.currentTime;

      masterGain.gain.setValueAtTime(0, now);
      ambientGain.gain.setValueAtTime(SILENCE, now);
      ambientGain.gain.exponentialRampToValueAtTime(1, now + AMBIENT_ATTACK_SECONDS);
      warmthGain.gain.setValueAtTime(0.72, now);
      warmthFilter.type = "lowpass";
      warmthFilter.frequency.setValueAtTime(680, now);
      warmthFilter.Q.setValueAtTime(0.3, now);

      ambientGain.connect(masterGain);
      masterGain.connect(context.destination);
      warmthGain.connect(warmthFilter);
      warmthFilter.connect(ambientGain);

      const padNotes = [
        { frequency: 110, type: "sine", gain: 0.032, detune: -4 },
        { frequency: 138.59, type: "sine", gain: 0.018, detune: 2 },
        { frequency: 164.81, type: "sine", gain: 0.013, detune: -2 },
        { frequency: 220, type: "triangle", gain: 0.0045, detune: 3 },
      ] as const;

      padNotes.forEach(({ frequency, type, gain, detune }, index) => {
        const oscillator = this.rememberNode(context.createOscillator());
        const oscillatorGain = this.rememberNode(context.createGain());
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.detune.setValueAtTime(detune, now);
        oscillatorGain.gain.setValueAtTime(SILENCE, now);
        oscillatorGain.gain.exponentialRampToValueAtTime(
          gain,
          now + AMBIENT_ATTACK_SECONDS + index * 0.18,
        );
        oscillator.connect(oscillatorGain);
        oscillatorGain.connect(warmthGain);
        createdSources.push(oscillator);
      });

      // Two sub-audio oscillators make the pad breathe and gently open its filter.
      const breathOscillator = this.rememberNode(context.createOscillator());
      const breathDepth = this.rememberNode(context.createGain());
      breathOscillator.type = "sine";
      breathOscillator.frequency.setValueAtTime(0.055, now);
      breathDepth.gain.setValueAtTime(0.045, now);
      breathOscillator.connect(breathDepth);
      breathDepth.connect(warmthGain.gain);
      createdSources.push(breathOscillator);

      const filterOscillator = this.rememberNode(context.createOscillator());
      const filterDepth = this.rememberNode(context.createGain());
      filterOscillator.type = "sine";
      filterOscillator.frequency.setValueAtTime(0.031, now);
      filterDepth.gain.setValueAtTime(85, now);
      filterOscillator.connect(filterDepth);
      filterDepth.connect(warmthFilter.frequency);
      createdSources.push(filterOscillator);

      const noise = this.rememberNode(context.createBufferSource());
      const breezeFilter = this.rememberNode(context.createBiquadFilter());
      const breezeGain = this.rememberNode(context.createGain());
      const airFilter = this.rememberNode(context.createBiquadFilter());
      const airGain = this.rememberNode(context.createGain());
      noise.buffer = createSeamlessOrganicNoiseBuffer(context);
      noise.loop = true;

      breezeFilter.type = "lowpass";
      breezeFilter.frequency.setValueAtTime(420, now);
      breezeFilter.Q.setValueAtTime(0.25, now);
      breezeGain.gain.setValueAtTime(0.012, now);

      airFilter.type = "bandpass";
      airFilter.frequency.setValueAtTime(1_250, now);
      airFilter.Q.setValueAtTime(0.55, now);
      airGain.gain.setValueAtTime(0.0035, now);

      noise.connect(breezeFilter);
      breezeFilter.connect(breezeGain);
      breezeGain.connect(ambientGain);
      noise.connect(airFilter);
      airFilter.connect(airGain);
      airGain.connect(ambientGain);
      createdSources.push(noise);

      createdSources.forEach((source) => {
        source.start(now + 0.04);
        this.continuousSources.add(source);
      });

      this.masterGain = masterGain;
      this.ambientGain = ambientGain;
      this.warmthGain = warmthGain;
      this.graphActive = true;
    } catch {
      createdSources.forEach((source) => safelyStopSource(source));
      this.disconnectGraph();
    }
  }

  private scheduleTonalBloom(
    context: AudioContext,
    frequency: number,
    startAt: number,
    duration: number,
    peakGain: number,
  ): void {
    const output = this.ambientGain;
    if (!output) return;

    const nodes: AudioNode[] = [];
    const sources: OscillatorNode[] = [];

    try {
      const fundamental = this.rememberTransientNode(context.createOscillator(), nodes);
      const overtone = this.rememberTransientNode(context.createOscillator(), nodes);
      const overtoneGain = this.rememberTransientNode(context.createGain(), nodes);
      const envelope = this.rememberTransientNode(context.createGain(), nodes);
      const softener = this.rememberTransientNode(context.createBiquadFilter(), nodes);
      const attackEndsAt = startAt + Math.min(0.24, duration * 0.12);
      const bodyEndsAt = startAt + duration * 0.46;
      const stopAt = startAt + duration;

      fundamental.type = "sine";
      fundamental.frequency.setValueAtTime(frequency * 0.997, startAt);
      fundamental.frequency.linearRampToValueAtTime(frequency, attackEndsAt + 0.2);

      overtone.type = "sine";
      overtone.frequency.setValueAtTime(frequency * 2.003, startAt);
      overtone.detune.setValueAtTime(-3, startAt);
      overtoneGain.gain.setValueAtTime(0.12, startAt);

      envelope.gain.setValueAtTime(SILENCE, startAt);
      envelope.gain.linearRampToValueAtTime(peakGain, attackEndsAt);
      envelope.gain.exponentialRampToValueAtTime(Math.max(SILENCE, peakGain * 0.52), bodyEndsAt);
      envelope.gain.exponentialRampToValueAtTime(SILENCE, stopAt);

      softener.type = "lowpass";
      softener.frequency.setValueAtTime(Math.min(1_900, Math.max(900, frequency * 5)), startAt);
      softener.Q.setValueAtTime(0.35, startAt);

      fundamental.connect(envelope);
      overtone.connect(overtoneGain);
      overtoneGain.connect(envelope);
      envelope.connect(softener);
      softener.connect(output);

      sources.push(fundamental, overtone);
      sources.forEach((source) => this.transientSources.add(source));
      fundamental.addEventListener("ended", () => {
        sources.forEach((source) => this.transientSources.delete(source));
        nodes.forEach((node) => {
          this.graphNodes.delete(node);
          safelyDisconnect(node);
        });
      }, { once: true });

      sources.forEach((source) => {
        source.start(startAt);
        source.stop(stopAt + 0.08);
      });
    } catch {
      sources.forEach((source) => {
        this.transientSources.delete(source);
        safelyStopSource(source);
      });
      nodes.forEach((node) => {
        this.graphNodes.delete(node);
        safelyDisconnect(node);
      });
    }
  }

  private rampMasterGain(): void {
    const context = this.context;
    const gain = this.masterGain?.gain;
    if (!context || !gain || !this.graphActive) return;
    const target = !this.desiredActive || this.lifecycleSuspended || this.muted
      ? 0
      : this.volume * MAX_OUTPUT_GAIN;
    this.rampAudioParam(gain, target, context.currentTime, PARAM_RAMP_SECONDS);
  }

  private rampAudioParam(
    parameter: AudioParam | undefined,
    target: number,
    now: number,
    duration: number,
  ): void {
    if (!parameter) return;
    try {
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(parameter.value, now);
      parameter.linearRampToValueAtTime(target, now + duration);
    } catch {
      // Some older engines expose incomplete AudioParam scheduling support.
      try {
        parameter.value = target;
      } catch {
        // Silence is preferable to surfacing an audio failure in the UI.
      }
    }
  }

  private async performStop(): Promise<void> {
    const context = this.context;
    this.growthActive = false;

    if (!context || !this.graphActive) {
      if (context && context.state === "running") await safelySuspend(context);
      return;
    }

    const now = context.currentTime;
    this.rampAudioParam(this.masterGain?.gain, 0, now, STOP_FADE_SECONDS);
    if (context.state === "running") await delay(STOP_FADE_SECONDS * 1000);

    this.disconnectGraph();
    if (context.state === "running") await safelySuspend(context);
  }

  private disconnectGraph(): void {
    const context = this.context;
    const stopAt = context?.currentTime ?? 0;

    this.continuousSources.forEach((source) => safelyStopSource(source, stopAt));
    this.transientSources.forEach((source) => safelyStopSource(source, stopAt));
    this.continuousSources.clear();
    this.transientSources.clear();
    this.graphNodes.forEach((node) => safelyDisconnect(node));
    this.graphNodes.clear();
    this.masterGain = null;
    this.ambientGain = null;
    this.warmthGain = null;
    this.graphActive = false;
  }

  private rememberNode<T extends AudioNode>(node: T): T {
    this.graphNodes.add(node);
    return node;
  }

  private rememberTransientNode<T extends AudioNode>(node: T, nodes: AudioNode[]): T {
    nodes.push(node);
    return this.rememberNode(node);
  }

  private isCurrentOperation(generation: number): boolean {
    return !this.destroyed
      && this.desiredActive
      && !this.lifecycleSuspended
      && this.operationGeneration === generation;
  }

  private async suspendIfInactive(context: AudioContext): Promise<void> {
    if ((!this.desiredActive || this.lifecycleSuspended) && context.state === "running") {
      await safelySuspend(context);
    }
  }
}

export const createAmbientSoundscape: AmbientSoundscapeFactory = () => (
  new ProceduralAmbientSoundscape()
);

function getAudioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const audioWindow = window as WebkitAudioWindow;
  return window.AudioContext ?? audioWindow.webkitAudioContext;
}

/**
 * Circular smoothing treats the end and beginning as neighbouring samples,
 * so the deterministic breeze has no special discontinuity at its loop seam.
 * A slow and a fine layer retain enough texture for the two quiet filters.
 */
function createSeamlessOrganicNoiseBuffer(context: AudioContext): AudioBuffer {
  const frameCount = Math.max(2_048, Math.floor(context.sampleRate * 12));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);
  const rawNoise = new Float32Array(frameCount);
  let state = 0x9e3779b9;

  for (let index = 0; index < frameCount; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    rawNoise[index] = ((state >>> 0) / 2_147_483_648) - 1;
  }

  const fineNoise = circularMovingAverage(rawNoise, 8);
  const broadNoise = circularMovingAverage(rawNoise, 72);

  let peak = 0;
  for (let index = 0; index < frameCount; index += 1) {
    const sample = (broadNoise[index] ?? 0) * 0.84 + (fineNoise[index] ?? 0) * 0.16;
    samples[index] = sample;
    peak = Math.max(peak, Math.abs(sample));
  }

  const scale = peak > 0 ? 0.22 / peak : 0;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = (samples[index] ?? 0) * scale;
  }

  return buffer;
}

function circularMovingAverage(source: Float32Array, radius: number): Float32Array {
  const output = new Float32Array(source.length);
  if (source.length === 0) return output;

  const windowSize = radius * 2 + 1;
  let sum = 0;
  for (let offset = -radius; offset <= radius; offset += 1) {
    sum += source[(offset + source.length) % source.length] ?? 0;
  }

  for (let index = 0; index < source.length; index += 1) {
    output[index] = sum / windowSize;
    const exitingIndex = (index - radius + source.length) % source.length;
    const enteringIndex = (index + radius + 1) % source.length;
    sum += (source[enteringIndex] ?? 0) - (source[exitingIndex] ?? 0);
  }

  return output;
}

function normaliseVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, value));
}

async function safelyResume(context: AudioContext): Promise<void> {
  if (context.state === "running" || context.state === "closed") return;
  try {
    await context.resume();
  } catch {
    // Autoplay policies can reject resume even after a user gesture.
  }
}

async function safelySuspend(context: AudioContext): Promise<void> {
  if (context.state !== "running") return;
  try {
    await context.suspend();
  } catch {
    // Suspending is an optimisation, never a functional requirement.
  }
}

function safelyStopSource(source: AudioScheduledSourceNode, when?: number): void {
  try {
    source.stop(when);
  } catch {
    // Stopping a source twice is harmless for our controller lifecycle.
  }
}

function safelyDisconnect(node: AudioNode): void {
  try {
    node.disconnect();
  } catch {
    // A node can already be disconnected by its ended handler.
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, milliseconds);
  });
}
