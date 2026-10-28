import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SoundEngine,
  presets,
  materials,
  renderSound,
  encodeWav,
  type ContextLike,
  type SourceLike,
  type EngineOptions,
  type Material,
} from "../src/core.js";
import {
  adaptNativeContext,
  type NativeContextLike,
  type NativeSourceLike,
} from "../src/native-adapter.js";
class MockSource implements SourceLike {
  buffer: unknown = null;
  onended: SourceLike["onended"] = null;
  stopped = false;
  disconnected = false;
  connect(_destination: unknown): void {}
  disconnect(): void {
    this.disconnected = true;
  }
  start(_when?: number): void {}
  stop(_when?: number): void {
    this.stopped = true;
  }
}
class MockContext implements ContextLike {
  sampleRate = 44100;
  currentTime = 0;
  state = "suspended";
  destination = {};
  sources: MockSource[] = [];
  createGain() {
    return {
      gain: {
        value: 1,
        setTargetAtTime(value: number) {
          this.value = value;
        },
      },
      connect(_destination: unknown) {},
      disconnect() {},
    };
  }
  createBuffer(_channels: number, length: number, _rate: number) {
    const data = new Float32Array(length);
    return { getChannelData: (_channel: number) => data };
  }
  createBufferSource() {
    const source = new MockSource();
    this.sources.push(source);
    return source;
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
  async close() {
    this.state = "closed";
  }
}
function setup(options: Partial<Omit<EngineOptions, "createContext">> = {}) {
  const context = new MockContext();
  return {
    context,
    engine: new SoundEngine({ createContext: () => context, ...options }),
  };
}

test("all 60 presets × 4 materials produce finite, faded, bounded PCM", () => {
  assert.equal(Object.keys(presets).length, 60);
  for (const definition of Object.values(presets))
    for (const material of Object.keys(materials) as Material[]) {
      const pcm = renderSound(definition, { material });
      assert.ok(pcm.length > 100);
      assert.equal(Math.abs(pcm[0]), 0);
      assert.equal(Math.abs(pcm[pcm.length - 1]), 0);
      let energy = 0;
      for (const sample of pcm) {
        assert.ok(Number.isFinite(sample));
        assert.ok(Math.abs(sample) <= 0.28001);
        energy += sample * sample;
      }
      assert.ok(energy > 0.0001);
    }
});
test("seeds are reproducible and controls change synthesis", () => {
  const original = renderSound(presets.swipe, { seed: 10 });
  assert.deepEqual(original, renderSound(presets.swipe, { seed: 10 }));
  assert.notDeepEqual(original, renderSound(presets.swipe, { seed: 11 }));
  assert.notDeepEqual(original, renderSound(presets.swipe, { pitch: 1.6 }));
  assert.throws(() => renderSound(presets.tap, {}, 0), RangeError);
});
test("PCM16 WAV has correct headers, rate and payload size", () => {
  const pcm = renderSound(presets.tap, {}, 48000),
    wav = encodeWav(pcm, 48000),
    view = new DataView(wav.buffer);
  assert.equal(new TextDecoder().decode(wav.slice(0, 4)), "RIFF");
  assert.equal(view.getUint32(24, true), 48000);
  assert.equal(view.getUint32(40, true), pcm.length * 2);
  assert.equal(view.getUint32(4, true), wav.length - 8);
});
test("mute, shared cooldown, polyphony and ended-source cleanup", async () => {
  const { engine, context } = setup({ maxVoices: 2 });
  assert.equal(engine.stats.state, "idle");
  engine.configure({ enabled: false });
  await engine.play("tap");
  assert.equal(context.sources.length, 0);
  engine.configure({ enabled: true });
  await engine.play("type");
  await engine.play("erase");
  assert.equal(context.sources.length, 1);
  await engine.play("success");
  await engine.play("tap", { force: true });
  assert.equal(engine.stats.activeVoices, 2);
  context.sources[0].onended?.();
  assert.equal(engine.stats.activeVoices, 1);
  engine.stopAll();
  assert.equal(engine.stats.activeVoices, 0);
  assert.ok(context.sources[1].stopped);
  await engine.dispose();
  await assert.rejects(engine.play("tap"), /disposed/);
});
test("cache is reused and respects its byte budget", async () => {
  const { engine, context } = setup({ cacheBytes: 20000 });
  await engine.play("tap", { seed: 42 });
  const buffer = context.sources[0].buffer;
  engine.stopAll();
  await engine.play("tap", { seed: 42, force: true });
  assert.equal(context.sources[1].buffer, buffer);
  await engine.play("success");
  assert.ok(engine.stats.cacheBytes <= 20000);
  engine.clearCache();
  assert.equal(engine.stats.cacheBytes, 0);
});
test("pending playback is cancelled by stopAll or dispose", async () => {
  const first = setup();
  const pending = first.engine.play("tap");
  first.engine.stopAll();
  await pending;
  assert.equal(first.engine.stats.activeVoices, 0);
  const second = setup();
  const other = second.engine.play("tap");
  await second.engine.dispose();
  await other;
  assert.equal(second.engine.stats.activeVoices, 0);
});
test("registration, offline export and lifecycle", async () => {
  const { engine } = setup();
  assert.throws(() => engine.render("toString"), /Unknown/);
  engine.register("custom", {
    label: "Mine",
    category: "Custom",
    voices: [{ frequency: 500, duration: 0.1 }],
  });
  assert.ok(engine.exportWav("custom").length > 100);
  assert.throws(() => engine.register("tap", presets.tap), /unique/);
  await engine.play("custom");
  await engine.suspend();
  assert.equal(engine.stats.state, "suspended");
  await engine.unlock();
  assert.equal(engine.stats.state, "running");
  await engine.dispose();
});
test("native onEnded is bridged and frees the voice", async () => {
  const context = new MockContext();
  let ended: NativeSourceLike["onEnded"];
  let disconnected = false;
  const source: NativeSourceLike = {
    buffer: null,
    get onEnded() {
      return ended;
    },
    set onEnded(value) {
      ended = value;
    },
    connect() {},
    disconnect() {
      disconnected = true;
    },
    start() {},
    stop() {},
  };
  const native: NativeContextLike = {
    get sampleRate() {
      return context.sampleRate;
    },
    get currentTime() {
      return context.currentTime;
    },
    get state() {
      return context.state;
    },
    destination: context.destination,
    createGain: () => context.createGain(),
    createBuffer: (...args) => context.createBuffer(...args),
    createBufferSource: () => source,
    resume: () => context.resume(),
    suspend: () => context.suspend(),
    close: () => context.close(),
  };
  const engine = new SoundEngine({
    createContext: () => adaptNativeContext(native),
  });
  await engine.play("tap");
  assert.equal(engine.stats.activeVoices, 1);
  source.onEnded?.();
  assert.equal(engine.stats.activeVoices, 0);
  assert.ok(disconnected);
  await engine.dispose();
});
