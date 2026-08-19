type ParamEvent = { kind: "cancel" | "set" | "exponential"; value: number; time: number };

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
  exponentialRampToValueAtTime(value: number, time: number): FakeAudioParam {
    this.value = value;
    this.events.push({ kind: "exponential", value, time });
    return this;
  }
}

class FakeNode {
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

class FakeGain extends FakeNode { readonly gain = new FakeAudioParam(); }
class FakeFilter extends FakeNode {
  type: BiquadFilterType = "lowpass";
  readonly frequency = new FakeAudioParam();
  readonly Q = new FakeAudioParam();
}
class FakeOscillator extends FakeNode {
  type: OscillatorType = "sine";
  readonly frequency = new FakeAudioParam();
  readonly starts: number[] = [];
  readonly stops: Array<number | undefined> = [];
  start(when = 0): void { this.starts.push(when); }
  stop(when?: number): void { this.stops.push(when); }
}
class FakeBufferSource extends FakeNode {
  buffer: AudioBuffer | null = null;
  loop = false;
  readonly starts: number[] = [];
  readonly stops: Array<number | undefined> = [];
  start(when = 0): void { this.starts.push(when); }
  stop(when?: number): void { this.stops.push(when); }
}
class FakeBuffer {
  readonly samples: Float32Array;
  constructor(length: number) { this.samples = new Float32Array(length); }
  getChannelData(): Float32Array { return this.samples; }
}

class FakeContext {
  static instances: FakeContext[] = [];
  state: AudioContextState = "suspended";
  currentTime = 12;
  sampleRate = 64;
  readonly destination = new FakeNode();
  readonly gains: FakeGain[] = [];
  readonly filters: FakeFilter[] = [];
  readonly oscillators: FakeOscillator[] = [];
  readonly bufferSources: FakeBufferSource[] = [];
  resumeCalls = 0;
  suspendCalls = 0;
  constructor() { FakeContext.instances.push(this); }
  createGain(): GainNode {
    const node = new FakeGain();
    this.gains.push(node);
    return node as unknown as GainNode;
  }
  createBiquadFilter(): BiquadFilterNode {
    const node = new FakeFilter();
    this.filters.push(node);
    return node as unknown as BiquadFilterNode;
  }
  createOscillator(): OscillatorNode {
    const node = new FakeOscillator();
    this.oscillators.push(node);
    return node as unknown as OscillatorNode;
  }
  createBufferSource(): AudioBufferSourceNode {
    const node = new FakeBufferSource();
    this.bufferSources.push(node);
    return node as unknown as AudioBufferSourceNode;
  }
  createBuffer(_channels: number, length: number): AudioBuffer {
    return new FakeBuffer(length) as unknown as AudioBuffer;
  }
  async resume(): Promise<void> { this.resumeCalls += 1; this.state = "running"; }
  async suspend(): Promise<void> { this.suspendCalls += 1; this.state = "suspended"; }
}

const originalAudioContext = Object.getOwnPropertyDescriptor(window, "AudioContext");
const originalWebkitAudioContext = Object.getOwnPropertyDescriptor(window, "webkitAudioContext");

function restore(name: string, descriptor: PropertyDescriptor | undefined): void {
  if (descriptor) Object.defineProperty(window, name, descriptor);
  else Reflect.deleteProperty(window, name);
}

describe("V3 procedural nature soundscape", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    FakeContext.instances = [];
    Reflect.deleteProperty(window, "webkitAudioContext");
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeContext });
  });

  afterEach(() => {
    restore("AudioContext", originalAudioContext);
    restore("webkitAudioContext", originalWebkitAudioContext);
    vi.useRealTimers();
  });

  it("does not create or start audio before the Begin gesture", async () => {
    const { createNatureSoundscape } = await import("../natureSoundscape");
    const soundscape = createNatureSoundscape();
    soundscape.setMode("rain");
    soundscape.setMuted(false);
    soundscape.setVolume(0.4);
    expect(FakeContext.instances).toHaveLength(0);
  });

  it("uses one context and crossfades from ocean noise to rain noise", async () => {
    const { createNatureSoundscape } = await import("../natureSoundscape");
    const soundscape = createNatureSoundscape();

    await soundscape.start("ocean", 0.3, false);
    expect(FakeContext.instances).toHaveLength(1);
    const context = FakeContext.instances[0];
    expect(context.bufferSources).toHaveLength(1);
    expect(context.bufferSources[0]?.loop).toBe(true);
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.connections[0]).toBeInstanceOf(FakeGain);
    expect(context.filters.map((filter) => filter.type)).toEqual(["lowpass", "bandpass"]);

    soundscape.setMode("rain");
    expect(FakeContext.instances).toHaveLength(1);
    expect(context.bufferSources).toHaveLength(2);
    expect(context.filters.map((filter) => filter.type)).toEqual([
      "lowpass", "bandpass", "highpass", "lowpass", "bandpass",
    ]);
    await vi.advanceTimersByTimeAsync(900);
    expect(context.bufferSources[0]?.stops).toHaveLength(1);

    const stopping = soundscape.stop();
    await vi.advanceTimersByTimeAsync(500);
    await stopping;
    expect(context.bufferSources[1]?.stops).toHaveLength(1);
    expect(context.suspendCalls).toBeGreaterThan(0);
  });

  it("ramps mute without creating another context and safely reuses the context", async () => {
    const { createNatureSoundscape } = await import("../natureSoundscape");
    const soundscape = createNatureSoundscape();
    await soundscape.start("rain", 0.45, false);
    const context = FakeContext.instances[0];
    const master = context.gains[0];
    soundscape.setMuted(true);
    expect(master?.gain.events.at(-1)).toMatchObject({ kind: "exponential", value: 0.0001 });

    const stopping = soundscape.stop();
    await vi.advanceTimersByTimeAsync(500);
    await stopping;
    await soundscape.start("ocean", 0.2, false);
    expect(FakeContext.instances).toHaveLength(1);
    expect(context.resumeCalls).toBeGreaterThanOrEqual(2);
  });
});
