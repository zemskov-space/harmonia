// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2026 Alexander Zemskov, zemskov.space
import { SoundEngine, type EngineOptions } from "./core.js";
export * from "./core.js";
export type CreateOptions = Omit<EngineOptions, "createContext"> & {
  createContext?: EngineOptions["createContext"];
};
export function createSoundEngine(options: CreateOptions = {}): SoundEngine {
  return new SoundEngine({
    ...options,
    createContext:
      options.createContext ??
      (() => {
        const Constructor =
          globalThis.AudioContext ?? (globalThis as any).webkitAudioContext;
        if (!Constructor)
          throw new Error(
            "Web Audio unavailable. In React Native import @zemskov-space/harmonia/native or inject AudioContext.",
          );
        return new Constructor({ latencyHint: "interactive" });
      }),
  });
}
