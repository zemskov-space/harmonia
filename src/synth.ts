// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2026 Alexander Zemskov, zemskov.space
import { materials, type Material, type SoundDefinition } from "./presets.js";
export interface RenderOptions {
  material?: Material;
  pitch?: number;
  brightness?: number;
  decay?: number;
  seed?: number;
}
export const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v));
export function finite(
  v: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  return v === undefined
    ? fallback
    : Number.isFinite(v)
      ? clamp(v, min, max)
      : fallback;
}
export function validateDefinition(def: SoundDefinition): void {
  if (
    !def ||
    !Array.isArray(def.voices) ||
    !def.voices.length ||
    def.voices.length > 16
  )
    throw new RangeError("A sound needs 1–16 voices");
  for (const v of def.voices) {
    if (
      !Number.isFinite(v.frequency) ||
      v.frequency < 20 ||
      v.frequency > 16000 ||
      !Number.isFinite(v.duration) ||
      v.duration < 0.005 ||
      v.duration > 2
    )
      throw new RangeError(
        "Voice frequency: 20–16000 Hz; duration: .005–2 seconds",
      );
    for (const key of [
      "at",
      "endFrequency",
      "gain",
      "noise",
      "harmonics",
      "attack",
    ] as const)
      if (v[key] !== undefined && !Number.isFinite(v[key]))
        throw new RangeError(`Invalid ${key}`);
    if ((v.at ?? 0) < 0 || (v.at ?? 0) > 3)
      throw new RangeError("Voice offset: 0–3 seconds");
  }
}
/** Deterministic PCM synthesis; no network, recording, samples, or platform globals. */
export function renderSound(
  def: SoundDefinition,
  options: RenderOptions = {},
  sampleRate = 44100,
): Float32Array {
  validateDefinition(def);
  if (!Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 96000)
    throw new RangeError("Sample rate: 8000–96000");
  const m = materials[options.material ?? "felt"];
  if (!m) throw new RangeError("Unknown material");
  const pitch = finite(options.pitch, 1, 0.25, 4) * m.pitch;
  const decay = finite(options.decay, 1, 0.25, 2) * m.decay;
  const brightness = finite(options.brightness, m.brightness, 0, 1);
  const duration =
    Math.max(...def.voices.map((v) => (v.at ?? 0) + v.duration * decay)) +
    0.012;
  const pcm = new Float32Array(Math.ceil(duration * sampleRate));
  let seed = (options.seed ?? 42) | 0;
  if (!seed) seed = 42;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) / 4294967296) * 2 - 1;
  };
  for (const voice of def.voices) {
    const start = Math.round((voice.at ?? 0) * sampleRate),
      length = Math.ceil(voice.duration * decay * sampleRate);
    let phase = 0,
      filtered = 0;
    const attack = finite(voice.attack, 0.002, 0.0005, 0.5),
      noise = finite(voice.noise, 0, 0, 1) * m.noise;
    for (let i = 0; i < length && start + i < pcm.length; i++) {
      const t = i / sampleRate,
        u = i / length;
      const f =
        Math.min(
          sampleRate * 0.2,
          Math.max(
            20,
            voice.frequency +
              ((voice.endFrequency ?? voice.frequency) - voice.frequency) * u,
          ),
        ) * pitch;
      phase += (Math.min(f, sampleRate * 0.4) * 2 * Math.PI) / sampleRate;
      filtered += (0.025 + brightness * 0.28) * (random() - filtered);
      const harmonic =
        Math.sin(phase * 2) * brightness * 0.22 +
        Math.sin(phase * 3) * finite(voice.harmonics, 0.06, 0, 1) * 0.2;
      const tone = Math.sin(phase) + harmonic;
      const envelope =
        Math.min(1, t / attack) *
        Math.exp(-6 * u) *
        Math.min(1, (length - i) / Math.max(1, 0.006 * sampleRate));
      pcm[start + i] +=
        (tone * (1 - noise * 0.65) + filtered * noise * 2) *
        envelope *
        finite(voice.gain, 1, 0, 1) *
        1.2;
    }
  }
  // Bounded peak, DC removal, and short fades prevent clicks and keep dense UI events gentle.
  let mean = 0;
  for (const x of pcm) mean += x;
  mean /= pcm.length;
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) {
    pcm[i] -= mean;
    peak = Math.max(peak, Math.abs(pcm[i]));
  }
  const gain = peak > 0.88 ? 0.88 / peak : 1;
  for (let i = 0; i < pcm.length; i++)
    pcm[i] *=
      gain *
      Math.min(
        1,
        i / (sampleRate * 0.001),
        (pcm.length - 1 - i) / (sampleRate * 0.003),
      );
  return pcm;
}
/** Mono PCM16 WAV, suitable for export or design review. */
export function encodeWav(pcm: Float32Array, sampleRate = 44100): Uint8Array {
  const data = new Uint8Array(44 + pcm.length * 2),
    view = new DataView(data.buffer);
  const str = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) data[offset + i] = s.charCodeAt(i);
  };
  str(0, "RIFF");
  view.setUint32(4, data.length - 8, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++)
    view.setInt16(
      44 + i * 2,
      Math.round(clamp(pcm[i], -1, 1) * (pcm[i] < 0 ? 32768 : 32767)),
      true,
    );
  return data;
}
