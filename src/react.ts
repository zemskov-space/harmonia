// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2026 Alexander Zemskov, zemskov.space
import {
  createContext,
  createElement,
  useContext,
  useSyncExternalStore,
  useCallback,
  type ReactNode,
} from "react";
import { type SoundEngine, type PlayOptions, type SoundName } from "./core.js";
const SoundContext = createContext<SoundEngine | null>(null);
/** Supply one app-owned engine. Provider doesn't dispose a shared instance on unmount. */
export function SoundProvider({
  engine,
  children,
}: {
  engine: SoundEngine;
  children: ReactNode;
}) {
  return createElement(SoundContext.Provider, { value: engine }, children);
}
export function useSound() {
  const engine = useContext(SoundContext);
  if (!engine)
    throw new Error("useSound needs <SoundProvider engine={engine}>");
  useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getSnapshot,
  );
  const play = useCallback(
    (name: SoundName | (string & {}), options?: PlayOptions) =>
      engine.play(name, options),
    [engine],
  );
  return {
    engine,
    play,
    settings: engine.settings,
    configure: engine.configure.bind(engine),
  };
}
