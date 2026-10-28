// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2026 Alexander Zemskov, zemskov.space
import {
  presets,
  type SoundName,
  type Material,
  type SoundDefinition,
} from "./presets.js";
import {
  renderSound,
  encodeWav,
  finite,
  validateDefinition,
  type RenderOptions,
} from "./synth.js";
export * from "./presets.js";
export * from "./synth.js";
// Structural subset shared by Web Audio and react-native-audio-api.
export interface AudioParamLike {
  value: number;
  setTargetAtTime(value: number, time: number, constant: number): unknown;
}
export interface NodeLike {
  connect(destination: any): unknown;
  disconnect(): unknown;
}
export interface BufferLike {
  getChannelData(channel: number): Float32Array;
}
export interface SourceLike extends NodeLike {
  buffer: any;
  onended: ((...args: any[]) => void) | null;
  start(when?: number): unknown;
  stop(when?: number): unknown;
}
export interface GainLike extends NodeLike {
  gain: AudioParamLike;
}
export interface ContextLike {
  readonly sampleRate: number;
  readonly currentTime: number;
  readonly state: string;
  readonly destination: any;
  createBuffer(channels: number, length: number, rate: number): BufferLike;
  createBufferSource(): SourceLike;
  createGain(): GainLike;
  resume(): Promise<unknown>;
  suspend(): Promise<unknown>;
  close(): Promise<unknown>;
}
export interface EngineOptions {
  volume?: number;
  enabled?: boolean;
  material?: Material;
  pitch?: number;
  brightness?: number;
  decay?: number;
  variation?: number;
  maxVoices?: number;
  cacheBytes?: number;
  createContext: () => ContextLike;
}
export interface PlayOptions extends RenderOptions {
  volume?: number;
  intensity?: number;
  delay?: number;
  /** Bypass cooldown for deliberate scores only. */ force?: boolean;
}
export interface Playback {
  stop(): void;
}
export interface Settings {
  volume: number;
  enabled: boolean;
  material: Material;
  pitch: number;
  brightness?: number;
  decay: number;
  variation: number;
}
export class SoundEngine {
  private context?: ContextLike;
  private master?: GainLike;
  private opening?: Promise<void>;
  private closed = false;
  private cache = new Map<string, { buffer: BufferLike; bytes: number }>();
  private bytes = 0;
  private custom = new Map<string, SoundDefinition>();
  private last = new Map<string, number>();
  private active = new Set<Playback>();
  private listeners = new Set<() => void>();
  private version = 0;
  private generation = 0;
  readonly maxVoices: number;
  readonly cacheLimit: number;
  private config: Settings;
  constructor(private readonly options: EngineOptions) {
    this.maxVoices = Math.round(finite(options.maxVoices, 8, 1, 24));
    this.cacheLimit = finite(
      options.cacheBytes,
      12 * 1024 * 1024,
      0,
      64 * 1024 * 1024,
    );
    this.config = {
      volume: finite(options.volume, 0.65, 0, 3),
      enabled: options.enabled ?? true,
      material: options.material ?? "felt",
      pitch: finite(options.pitch, 1, 0.25, 4),
      brightness:
        options.brightness === undefined
          ? undefined
          : finite(options.brightness, 0.2, 0, 1),
      decay: finite(options.decay, 1, 0.25, 2),
      variation: finite(options.variation, 0.35, 0, 1),
    };
    if (!["felt", "glass", "wood", "bubble"].includes(this.config.material))
      throw new RangeError("Unknown material");
  }
  get settings(): Readonly<Settings> {
    return { ...this.config };
  }
  get stats() {
    return {
      activeVoices: this.active.size,
      cachedSounds: this.cache.size,
      cacheBytes: this.bytes,
      sampleRate: this.context?.sampleRate ?? 44100,
      state: this.closed ? "closed" : (this.context?.state ?? "idle"),
    };
  }
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.version;
  private notify() {
    this.version++;
    for (const listener of this.listeners) listener();
  }
  configure(next: Partial<Settings>): void {
    if (this.closed) throw new Error("SoundEngine is disposed");
    const updated = { ...this.config, ...next };
    if (!["felt", "glass", "wood", "bubble"].includes(updated.material))
      throw new RangeError("Unknown material");
    this.config = {
      volume: finite(updated.volume, 0.65, 0, 3),
      enabled: !!updated.enabled,
      material: updated.material,
      pitch: finite(updated.pitch, 1, 0.25, 4),
      brightness:
        updated.brightness === undefined
          ? undefined
          : finite(updated.brightness, 0.2, 0, 1),
      decay: finite(updated.decay, 1, 0.25, 2),
      variation: finite(updated.variation, 0.35, 0, 1),
    };
    if (this.master && this.context)
      this.master.gain.setTargetAtTime(
        this.masterVolume(),
        this.context.currentTime,
        0.012,
      );
    if (!this.config.enabled) this.stopAll();
    this.notify();
  }
  private masterVolume() {
    return this.config.enabled ? this.config.volume : 0;
  }
  /** Call from a user gesture on web. Lazy construction is safe during SSR. */
  async unlock(): Promise<void> {
    if (this.closed) throw new Error("SoundEngine is disposed");
    if (this.opening) return this.opening;
    if (!this.context) {
      this.context = this.options.createContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.masterVolume();
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "running") return;
    this.opening = this.context
      .resume()
      .then(() => {})
      .finally(() => {
        this.opening = undefined;
      });
    return this.opening;
  }
  private definition(name: string): SoundDefinition {
    const def =
      this.custom.get(name) ??
      (Object.prototype.hasOwnProperty.call(presets, name)
        ? (presets as Record<string, SoundDefinition>)[name]
        : undefined);
    if (!def) throw new RangeError(`Unknown sound: ${name}`);
    return def;
  }
  register(name: string, definition: SoundDefinition): void {
    if (
      !name ||
      name.length > 100 ||
      Object.prototype.hasOwnProperty.call(presets, name)
    )
      throw new Error("Use a unique custom name (1–100 chars)");
    validateDefinition(definition);
    this.custom.set(name, {
      ...definition,
      voices: definition.voices.map((v) => ({ ...v })),
    });
    this.clearCache();
  }
  private renderOptions(
    options: RenderOptions = {},
    variant = 0,
  ): RenderOptions {
    return {
      material: options.material ?? this.config.material,
      pitch:
        finite(options.pitch, this.config.pitch, 0.25, 4) *
        (1 + (variant - 1.5) * 0.018 * this.config.variation),
      brightness: options.brightness ?? this.config.brightness,
      decay: finite(options.decay, this.config.decay, 0.25, 2),
      seed: options.seed ?? 42 + variant * 7919,
    };
  }
  render(
    name: SoundName | (string & {}),
    options: RenderOptions = {},
  ): Float32Array {
    return renderSound(
      this.definition(name),
      this.renderOptions(options, 1.5),
      this.context?.sampleRate ?? 44100,
    );
  }
  exportWav(
    name: SoundName | (string & {}),
    options: RenderOptions = {},
  ): Uint8Array {
    return encodeWav(
      this.render(name, options),
      this.context?.sampleRate ?? 44100,
    );
  }
  private buffer(name: string, options: RenderOptions): BufferLike {
    const key = name + JSON.stringify(options);
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached.buffer;
    }
    const ctx = this.context!;
    const pcm = renderSound(this.definition(name), options, ctx.sampleRate);
    const buffer = ctx.createBuffer(1, pcm.length, ctx.sampleRate);
    buffer.getChannelData(0).set(pcm);
    if (pcm.byteLength <= this.cacheLimit) {
      while (this.bytes + pcm.byteLength > this.cacheLimit && this.cache.size) {
        const oldest = this.cache.keys().next().value!;
        this.bytes -= this.cache.get(oldest)!.bytes;
        this.cache.delete(oldest);
      }
      this.cache.set(key, { buffer, bytes: pcm.byteLength });
      this.bytes += pcm.byteLength;
    }
    return buffer;
  }
  async play(
    name: SoundName | (string & {}),
    options: PlayOptions = {},
  ): Promise<Playback | undefined> {
    if (this.closed) throw new Error("SoundEngine is disposed");
    const def = this.definition(name);
    if (!this.config.enabled || !this.config.volume) return;
    const key = def.group ?? name,
      now = Date.now();
    if (
      !options.force &&
      now - (this.last.get(key) ?? -Infinity) <
        finite(def.cooldown, 30, 0, 5000)
    )
      return;
    this.last.set(key, now);
    const generation = this.generation;
    await this.unlock();
    if (
      this.closed ||
      generation !== this.generation ||
      !this.config.enabled ||
      this.context?.state !== "running"
    )
      return;
    // Drop surplus events; don't queue a stale burst of UI feedback.
    if (this.active.size >= this.maxVoices) return;
    const ctx = this.context!,
      source = ctx.createBufferSource(),
      gain = ctx.createGain();
    const variant =
      options.seed === undefined ? Math.floor(Math.random() * 4) : 1.5;
    source.buffer = this.buffer(name, this.renderOptions(options, variant));
    gain.gain.value =
      finite(options.volume, 1, 0, 3) * finite(options.intensity, 1, 0, 3);
    source.connect(gain);
    gain.connect(this.master!);
    let stopped = false;
    const clean = () => {
      this.active.delete(handle);
      source.onended = null;
      source.disconnect();
      gain.disconnect();
    };
    const handle: Playback = {
      stop: () => {
        if (stopped) return;
        stopped = true;
        try {
          source.stop();
        } finally {
          clean();
        }
      },
    };
    source.onended = () => {
      if (stopped) return;
      stopped = true;
      clean();
    };
    this.active.add(handle);
    try {
      source.start(ctx.currentTime + finite(options.delay, 0, 0, 3));
    } catch (error) {
      stopped = true;
      clean();
      throw error;
    }
    return handle;
  }
  /** Prewarm common sounds after unlocking; native apps can do this on startup. */
  async preload(
    names: readonly (SoundName | (string & {}))[] = [
      "tap",
      "scroll",
      "type",
      "erase",
      "menuOpen",
      "menuClose",
    ],
  ): Promise<void> {
    await this.unlock();
    for (let i = 0; i < names.length; i++) {
      if (this.closed) return;
      for (let variant = 0; variant < 4; variant++)
        this.buffer(names[i], this.renderOptions({}, variant));
      if (i % 4 === 3) await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  stopAll(): void {
    this.generation++;
    for (const handle of [...this.active]) handle.stop();
  }
  clearCache(): void {
    this.cache.clear();
    this.bytes = 0;
  }
  async suspend(): Promise<void> {
    this.stopAll();
    if (this.context?.state === "running") await this.context.suspend();
  }
  async dispose(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.stopAll();
    this.clearCache();
    this.last.clear();
    this.listeners.clear();
    if (this.context && this.context.state !== "closed")
      await this.context.close();
  }
}
