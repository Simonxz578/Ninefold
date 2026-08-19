import { createAmbientSoundscape } from "../ambientSoundscape";

type ParamEvent = {
  kind: "cancel" | "set" | "linear" | "exponential";
  value: number;
  time: number;
};

class FakeAudioParam {
  value = 0;
  readonly events: ParamEvent[] = [];

  cancelScheduledValues(time: number): FakeAudioParam {
    this.events.push({ kind: "cancel", value: this.value, time });
    return this;
  }

  setValueAtTime(value: number, time: number): FakeAudioParam {
    this.value = value;
    this.events.push({ kind: "set", value, time });
    return this;
  }

  linearRampToValueAtTime(value: number, time: number): FakeAudioParam {
    this.value = value;
    this.events.push({ kind: "linear", value, time });
    return this;
  }

  exponentialRampToValueAtTime(value: number, time: number): FakeAudioParam {
    this.value = value;
    this.events.push({ kind: "exponential", value, time });
    return this;
  }
}

class FakeAudioNode {
  readonly connections: unknown[] = [];
  disconnectCalls = 0;

  connect(destination: unknown): unknown {
    this.connections.push(destination);
    return destination;
  }

  disconnect(): void {
    this.disconnectCalls += 1;
  }
}

class FakeGainNode extends FakeAudioNode {
  readonly gain = new FakeAudioParam();
}

class FakeOscillatorNode extends FakeAudioNode {
  type: OscillatorType = "sine";
  readonly frequency = new FakeAudioParam();
  readonly detune = new FakeAudioParam();
  readonly starts: number[] = [];
  readonly stops: Array<number | undefined> = [];
  endedListener: EventListenerOrEventListenerObject | null = null;

  start(when = 0): void {
    this.starts.push(when);
  }

  stop(when?: number): void {
    this.stops.push(when);
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
  ): void {
    if (type === "ended") this.endedListener = listener;
  }
}

class FakeBufferSourceNode extends FakeAudioNode {
  buffer: AudioBuffer | null = null;
  loop = false;
  readonly starts: number[] = [];
  readonly stops: Array<number | undefined> = [];

  start(when = 0): void {
    this.starts.push(when);
  }

  stop(when?: number): void {
    this.stops.push(when);
  }
}

class FakeBiquadFilterNode extends FakeAudioNode {
  type: BiquadFilterType = "lowpass";
  readonly frequency = new FakeAudioParam();
  readonly Q = new FakeAudioParam();
}

class FakeAudioBuffer {
  readonly samples: Float32Array;

  constructor(length: number) {
    this.samples = new Float32Array(length);
  }

  getChannelData(): Float32Array {
    return this.samples;
  }
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  static rejectResume = false;
  static rejectSuspend = false;
  static rejectClose = false;
  static resumeGate: Promise<void> | null = null;

  state: AudioContextState = "suspended";
  readonly currentTime = 10;
  readonly sampleRate = 64;
  readonly destination = new FakeAudioNode();
  readonly gains: FakeGainNode[] = [];
  readonly oscillators: FakeOscillatorNode[] = [];
  readonly bufferSources: FakeBufferSourceNode[] = [];
  readonly filters: FakeBiquadFilterNode[] = [];
  readonly buffers: FakeAudioBuffer[] = [];
  resumeCalls = 0;
  suspendCalls = 0;
  closeCalls = 0;

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createGain(): GainNode {
    const node = new FakeGainNode();
    this.gains.push(node);
    return node as unknown as GainNode;
  }

  createOscillator(): OscillatorNode {
    const node = new FakeOscillatorNode();
    this.oscillators.push(node);
    return node as unknown as OscillatorNode;
  }

  createBufferSource(): AudioBufferSourceNode {
    const node = new FakeBufferSourceNode();
    this.bufferSources.push(node);
    return node as unknown as AudioBufferSourceNode;
  }

  createBiquadFilter(): BiquadFilterNode {
    const node = new FakeBiquadFilterNode();
    this.filters.push(node);
    return node as unknown as BiquadFilterNode;
  }

  createBuffer(_channels: number, length: number): AudioBuffer {
    const buffer = new FakeAudioBuffer(length);
    this.buffers.push(buffer);
    return buffer as unknown as AudioBuffer;
  }

  async resume(): Promise<void> {
    this.resumeCalls += 1;
    if (FakeAudioContext.rejectResume) throw new Error("resume blocked");
    if (FakeAudioContext.resumeGate) await FakeAudioContext.resumeGate;
    this.state = "running";
  }

  async suspend(): Promise<void> {
    this.suspendCalls += 1;
    if (FakeAudioContext.rejectSuspend) throw new Error("suspend blocked");
    this.state = "suspended";
  }

  async close(): Promise<void> {
    this.closeCalls += 1;
    if (FakeAudioContext.rejectClose) throw new Error("close blocked");
    this.state = "closed";
  }
}

const originalAudioContext = Object.getOwnPropertyDescriptor(window, "AudioContext");
const originalWebkitAudioContext = Object.getOwnPropertyDescriptor(window, "webkitAudioContext");

function installAudioContext(name: "AudioContext" | "webkitAudioContext" = "AudioContext"): void {
  Object.defineProperty(window, name, {
    configurable: true,
    writable: true,
    value: FakeAudioContext,
  });
}

function removeAudioContext(name: "AudioContext" | "webkitAudioContext"): void {
  Reflect.deleteProperty(window, name);
}

function restoreProperty(name: string, descriptor: PropertyDescriptor | undefined): void {
  if (descriptor) Object.defineProperty(window, name, descriptor);
  else Reflect.deleteProperty(window, name);
}

async function finishFade(promise: Promise<void>): Promise<void> {
  await vi.advanceTimersByTimeAsync(500);
  await promise;
}

describe("procedural ambient soundscape", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeAudioContext.instances = [];
    FakeAudioContext.rejectResume = false;
    FakeAudioContext.rejectSuspend = false;
    FakeAudioContext.rejectClose = false;
    FakeAudioContext.resumeGate = null;
    removeAudioContext("AudioContext");
    removeAudioContext("webkitAudioContext");
  });

  afterEach(() => {
    restoreProperty("AudioContext", originalAudioContext);
    restoreProperty("webkitAudioContext", originalWebkitAudioContext);
    vi.useRealTimers();
  });

  it("creates one context lazily and builds the same quiet noise bed each time", async () => {
    installAudioContext();
    const first = createAmbientSoundscape();
    const second = createAmbientSoundscape();

    first.setVolume(0.8);
    first.setMuted(false);
    await first.resume();
    expect(FakeAudioContext.instances).toHaveLength(0);

    await first.start(0.5, false);
    await first.start(0.9, true);
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].oscillators).toHaveLength(6);
    expect(FakeAudioContext.instances[0].oscillators.slice(0, 4)
      .map((oscillator) => oscillator.frequency.value)).toEqual([
      110,
      138.59,
      164.81,
      220,
    ]);
    expect(FakeAudioContext.instances[0].bufferSources).toHaveLength(1);
    expect(FakeAudioContext.instances[0].filters[0].type).toBe("lowpass");
    expect(FakeAudioContext.instances[0].filters.map((filter) => filter.type)).toEqual([
      "lowpass",
      "lowpass",
      "bandpass",
    ]);

    await second.start(0.5, false);
    expect(FakeAudioContext.instances).toHaveLength(2);
    expect(Array.from(FakeAudioContext.instances[1].buffers[0].samples)).toEqual(
      Array.from(FakeAudioContext.instances[0].buffers[0].samples),
    );
    const samples = FakeAudioContext.instances[0].buffers[0].samples;
    expect(Math.abs((samples.at(-1) ?? 0) - (samples[0] ?? 0))).toBeLessThan(0.02);

    const firstDestroy = first.destroy();
    const secondDestroy = second.destroy();
    await vi.advanceTimersByTimeAsync(500);
    await Promise.all([firstDestroy, secondDestroy]);
  });

  it("ramps volume and mute, and prevents overlapping growth sequences", async () => {
    installAudioContext();
    const soundscape = createAmbientSoundscape();
    await soundscape.start(0.5, false);
    const context = FakeAudioContext.instances[0];
    const master = context.gains[0].gain;

    expect(master.events).toContainEqual({ kind: "linear", value: 0.08, time: 10.28 });
    soundscape.setMuted(true);
    expect(master.events.at(-1)).toEqual({ kind: "linear", value: 0, time: 10.28 });
    soundscape.setVolume(2);
    soundscape.setMuted(false);
    expect(master.events.at(-1)).toEqual({ kind: "linear", value: 0.16, time: 10.28 });

    soundscape.beginGrowth();
    expect(context.oscillators).toHaveLength(16);
    expect(context.oscillators.slice(-10).filter((_, index) => index % 2 === 0)
      .map((node) => node.frequency.value)).toEqual([
      220,
      246.94,
      277.18,
      329.63,
      369.99,
    ]);
    const growthEnvelopes = context.gains.slice(-10).filter((_, index) => index % 2 === 1);
    expect(growthEnvelopes.every((gain) => (
      gain.gain.events.some((event) => event.kind === "linear")
      && gain.gain.events.filter((event) => event.kind === "exponential").length === 2
    ))).toBe(true);
    soundscape.beginGrowth();
    expect(context.oscillators).toHaveLength(16);

    soundscape.complete();
    expect(context.oscillators).toHaveLength(22);
    soundscape.complete();
    expect(context.oscillators).toHaveLength(22);

    await finishFade(soundscape.destroy());
  });

  it("fades, disconnects, suspends, restarts without overlap, then closes", async () => {
    installAudioContext();
    const soundscape = createAmbientSoundscape();
    await soundscape.start(0.4, false);
    const context = FakeAudioContext.instances[0];
    const firstSources = [...context.oscillators, ...context.bufferSources];

    await finishFade(soundscape.stop());
    expect(context.state).toBe("suspended");
    expect(firstSources.every((source) => source.stops.length > 0)).toBe(true);
    expect(firstSources.every((source) => source.disconnectCalls > 0)).toBe(true);

    await soundscape.start(0.3, false);
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(context.oscillators).toHaveLength(12);
    expect(context.bufferSources).toHaveLength(2);

    await finishFade(soundscape.destroy());
    expect(context.state).toBe("closed");
    expect(context.closeCalls).toBe(1);
    await expect(soundscape.start(1, false)).resolves.toBeUndefined();
    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  it("degrades to silence for missing, prefixed, or rejected Web Audio APIs", async () => {
    const unavailable = createAmbientSoundscape();
    await expect(unavailable.start(0.3, false)).resolves.toBeUndefined();
    unavailable.beginGrowth();
    unavailable.complete();
    await expect(unavailable.stop()).resolves.toBeUndefined();
    await expect(unavailable.destroy()).resolves.toBeUndefined();

    installAudioContext("webkitAudioContext");
    FakeAudioContext.rejectResume = true;
    FakeAudioContext.rejectClose = true;
    const rejected = createAmbientSoundscape();
    await expect(rejected.start(Number.NaN, false)).resolves.toBeUndefined();
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].resumeCalls).toBe(1);
    await expect(rejected.destroy()).resolves.toBeUndefined();
    expect(FakeAudioContext.instances[0].closeCalls).toBe(1);
  });

  it("fades around visibility suspension and lets the latest lifecycle action win", async () => {
    installAudioContext();
    const soundscape = createAmbientSoundscape();
    await soundscape.start(0.5, false);
    const context = FakeAudioContext.instances[0];
    const master = context.gains[0].gain;

    const suspend = soundscape.suspend();
    expect(master.events.at(-1)).toEqual({ kind: "linear", value: 0, time: 10.28 });
    await vi.advanceTimersByTimeAsync(280);
    await suspend;
    expect(context.state).toBe("suspended");

    await soundscape.resume();
    expect(context.state).toBe("running");
    expect(master.events.at(-1)).toEqual({ kind: "linear", value: 0.08, time: 10.28 });

    const staleSuspend = soundscape.suspend();
    await soundscape.resume();
    await vi.advanceTimersByTimeAsync(280);
    await staleSuspend;
    expect(context.state).toBe("running");

    await finishFade(soundscape.destroy());
  });

  it("does not build or play a graph when Stop wins a pending-resume race", async () => {
    installAudioContext();
    let releaseResume: () => void = () => void 0;
    FakeAudioContext.resumeGate = new Promise<void>((resolve) => {
      releaseResume = resolve;
    });
    const soundscape = createAmbientSoundscape();

    const start = soundscape.start(0.5, false);
    await Promise.resolve();
    const context = FakeAudioContext.instances[0];
    expect(context.resumeCalls).toBe(1);

    await soundscape.stop();
    releaseResume();
    await start;

    expect(context.oscillators).toHaveLength(0);
    expect(context.bufferSources).toHaveLength(0);
    expect(context.state).toBe("suspended");
    soundscape.beginGrowth();
    expect(context.oscillators).toHaveLength(0);

    await soundscape.destroy();
    expect(context.state).toBe("closed");
  });
});
