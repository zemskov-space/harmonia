# Harmonia

### Sound, with feeling. by [zemskov.space](https://zemskov.space)

Procedural UI sound engine for Web, React, and React Native. 60 responsive sound presets, 4 expressive acoustic materials, and a tiny, zero-dependency TypeScript engine.

- **Zero Audio Assets:** No `.mp3` or `.wav` files to download, bundle, or cache over the network.
- **Pure Procedural Synthesis:** Damped physical resonators, filtered noise, and deterministic PRNG synthesized directly in TypeScript.
- **Dual Runtime Support:** Native Web Audio API in browsers, and `react-native-audio-api` on iOS and Android.
- **Smart Engine Controls:** Built-in byte-budgeted LRU cache, polyphony limiting, cooldown throttling, and voice cancellation.
- **SSR Safe:** Lazy AudioContext initialization does not throw during server-side rendering (Next.js, Astro, Remix).
- **Interactive Playground:** [Live GitHub Pages Demo](https://zemskov-space.github.io/harmonia/)

---

## Quickstart

### Installation

```sh
npm install @zemskov-space/harmonia
```

For **React Native** projects, also install the native audio peer dependencies:

```sh
npm install react-native-audio-api@^0.13.6 react-native-worklets@^0.7.0
npx pod-install
```
*(Requires React Native development builds; Expo Go is not supported).*

---

### 1. Web (Vanilla / Modern Bundlers)

```ts
import { createSoundEngine } from '@zemskov-space/harmonia';

const sound = createSoundEngine({ material: 'felt', volume: 0.65 });

// Unlock on first user gesture (especially Safari / iOS)
button.addEventListener('click', async () => {
  await sound.unlock();
  await sound.play('tap');
});
```

---

### 2. React (Provider & Hook)

```tsx
import { createSoundEngine } from '@zemskov-space/harmonia';
import { SoundProvider, useSound } from '@zemskov-space/harmonia/react';

// Single app-owned instance created outside of render
const sound = createSoundEngine({ material: 'felt', volume: 0.65 });

function SaveButton() {
  const { play } = useSound();
  return (
    <button onClick={() => void play('success').catch(console.warn)}>
      Save
    </button>
  );
}

export function App() {
  return (
    <SoundProvider engine={sound}>
      <SaveButton />
    </SoundProvider>
  );
}
```

The `useSound()` hook provides `{ play, engine, settings, configure }`.

---

### 3. React Native

```tsx
import { createSoundEngine } from '@zemskov-space/harmonia/native';
import { SoundProvider, useSound } from '@zemskov-space/harmonia/react';

const sound = createSoundEngine({ material: 'felt', volume: 0.65 });

// Preload common sounds into cache on startup
await sound.preload(['tap', 'toggleOn', 'scroll']);
await sound.play('toggleOn');
```

---

## API Reference

### SoundEngine

```ts
const sound = createSoundEngine({
  material: 'felt',    // 'felt' | 'glass' | 'wood' | 'bubble' (default: 'felt')
  volume: 0.65,        // 0 to 1 (default: 0.65)
  pitch: 1,            // 0.25 to 4 (default: 1)
  decay: 1,            // 0.25 to 2 (default: 1)
  brightness: 0.2,     // 0 to 1 (optional, defaults to material brightness)
  variation: 0.35,     // 0 to 1 subtle acoustic micro-variations (default: 0.35)
  maxVoices: 8,        // 1 to 24 simultaneous voices (default: 8)
  cacheBytes: 12 * 1024 * 1024, // LRU cache limit (default: 12 MiB)
});
```

### Methods

| Method | Description |
|---|---|
| `sound.play(name, options?)` | Play a preset or custom sound. Returns a `Playback` handle (`{ stop() }`) or `undefined` if muted/throttled. |
| `sound.configure(settings)` | Real-time update of `volume`, `material`, `pitch`, `decay`, `enabled`, etc. |
| `sound.unlock()` | Resumes/creates the `AudioContext`. Call inside a user gesture event. |
| `sound.preload(names?)` | Pre-renders frequently used sounds into the memory cache. |
| `sound.stopAll()` | Immediately silences all playing voices and cancels pending playbacks. |
| `sound.suspend()` | Suspends audio context (ideal for `visibilitychange` or background `AppState`). |
| `sound.dispose()` | Tears down audio context and releases all cached buffers. |
| `sound.register(name, def)` | Registers a custom multi-voice sound definition. |
| `sound.render(name, options?)` | Returns raw `Float32Array` PCM samples without hardware/audio context. |
| `sound.exportWav(name, options?)` | Returns a standard mono 16-bit PCM WAV `Uint8Array`. |

### Play Options

```ts
await sound.play('scroll', {
  volume: 0.8,     // 0..1 scale
  intensity: 0.5,  // 0..1 dynamic modulation
  pitch: 1.1,      // 0.25..4 pitch multiplier
  delay: 0,        // seconds before start
  seed: 42,        // deterministic PRNG seed (bypasses random variation)
  force: true,     // bypass cooldown throttling for deliberate scores
});
```

---

## Acoustic Materials

Harmonia shapes each sound through physical acoustic material models:

| Material | Character | Key Trait |
|---|---|---|
| **`felt`** | Soft, warm, muted | Minimal high frequencies; perfect for subtle, elegant interactions. |
| **`glass`** | Crisp, bright, bell-like | Higher pitch, long shimmering decay, distinct clarity. |
| **`wood`** | Tactile, dry, organic | Percussive attack, woody body resonance, medium decay. |
| **`bubble`** | Buoyant, light, playful | Rounded transient, gentle pitch glide, joyful character. |

---

## 60 Sound Presets

Harmonia includes 60 procedurally tuned UI sound presets across 6 functional categories:

- **Touch (12):** `tap`, `click`, `press`, `release`, `toggleOn`, `toggleOff`, `select`, `deselect`, `check`, `uncheck`, `hover`, `longPress`.
- **Motion (13):** `menuOpen`, `menuClose`, `expand`, `collapse`, `sheetOpen`, `sheetClose`, `swipe`, `pageNext`, `pageBack`, `dragStart`, `dragMove`, `drop`, `snap`.
- **Scroll (6):** `scroll`, `scrollTick`, `scrollEdge`, `picker`, `slider`, `refresh`.
- **Keyboard (9):** `type`, `space`, `erase`, `enter`, `focus`, `blur`, `copy`, `paste`, `undo`.
- **Feedback (12):** `success`, `error`, `warning`, `notification`, `message`, `send`, `receive`, `complete`, `delete`, `cancel`, `lock`, `unlock`.
- **Playful (8):** `pop`, `bubble`, `sparkle`, `heart`, `tick`, `knock`, `breathe`, `celebrate`.

---

## Custom Sound Definitions

You can register custom sounds composed of up to 16 additive resonators and noise:

```ts
sound.register('customChime', {
  label: 'Chime',
  category: 'Custom',
  cooldown: 100, // min ms between triggers
  voices: [
    { frequency: 660, duration: 0.18, gain: 0.5 },
    { frequency: 990, duration: 0.25, at: 0.06, gain: 0.3 },
    { frequency: 1320, duration: 0.30, at: 0.12, gain: 0.2 },
  ],
});

await sound.play('customChime', { material: 'glass' });
```

---

## Development & Playground

Harmonia includes an interactive React demo for GitHub Pages that directly imports local TypeScript engine sources without bundling delays:

```sh
npm ci
npm run dev
```

### Useful Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Launch local Vite dev server for the interactive playground. |
| `npm run check` | Run TypeScript typecheck and Node.js engine unit tests. |
| `npm test` | Run engine synthesis and bridge tests in `.test-build/`. |
| `npm run build` | Compile library to ESM `.js`, `.d.ts`, and source maps in `lib/`. |
| `npm run build:demo` | Compile GitHub Pages React demo into `dist-demo/`. |
| `npm run preview:demo` | Locally preview the built GitHub Pages distribution. |
| `npm pack --dry-run` | Inspect npm package contents before publishing. |

---

## Publishing to npm

1. Ensure the scope name in `package.json` corresponds to your npm account or organization (`@YOUR_SCOPE/harmonia`).
2. Verify all checks pass:
   ```sh
   npm run check
   npm run build
   npm pack --dry-run
   ```
3. Publish:
   ```sh
   npm publish --access public
   ```
*(The `prepack` script automatically runs typechecks, tests, and builds `lib/` before packaging. The GitHub Pages demo is excluded from npm tarballs via the `files` directive).*

---

## Licensing

Harmonia 0.2.0 is licensed under the **GNU Affero General Public License v3** (`AGPL-3.0-only`). See [LICENSE](LICENSE) and [LICENSING.md](LICENSING.md) for details.

For commercial licensing agreements and exceptions without copyleft obligations, visit [zemskov.space](https://zemskov.space).
