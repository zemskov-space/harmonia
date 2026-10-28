// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2026 Alexander Zemskov, zemskov.space
import { AudioContext } from "react-native-audio-api";
import { SoundEngine, type EngineOptions } from "./core.js";
import { adaptNativeContext } from "./native-adapter.js";
export * from "./core.js";
export type CreateOptions = Omit<EngineOptions, "createContext"> & {
  createContext?: EngineOptions["createContext"];
};
export function createSoundEngine(options: CreateOptions = {}): SoundEngine {
  return new SoundEngine({
    ...options,
    createContext:
      options.createContext ?? (() => adaptNativeContext(new AudioContext())),
  });
}
