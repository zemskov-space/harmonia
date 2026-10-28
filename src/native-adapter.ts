// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2026 Alexander Zemskov, zemskov.space
import type { ContextLike, SourceLike } from "./core.js";
/** Native Audio API 0.13 uses onEnded; browsers use onended. */
export interface NativeSourceLike extends Omit<SourceLike, "onended"> {
  onEnded: ((...args: any[]) => void) | null | undefined;
}
export interface NativeContextLike
  extends Omit<ContextLike, "createBufferSource"> {
  createBufferSource(): NativeSourceLike;
}
export function adaptNativeContext(context: NativeContextLike): ContextLike {
  return {
    get sampleRate() {
      return context.sampleRate;
    },
    get currentTime() {
      return context.currentTime;
    },
    get state() {
      return context.state;
    },
    get destination() {
      return context.destination;
    },
    createBuffer: (channels, length, rate) =>
      context.createBuffer(channels, length, rate),
    createGain: () => context.createGain(),
    resume: () => context.resume(),
    suspend: () => context.suspend(),
    close: () => context.close(),
    createBufferSource: () => {
      const native = context.createBufferSource();
      let callback: SourceLike["onended"] = null;
      return {
        get buffer() {
          return native.buffer;
        },
        set buffer(value) {
          native.buffer = value;
        },
        get onended() {
          return callback;
        },
        set onended(value) {
          callback = value;
          native.onEnded = value ? () => value() : null;
        },
        connect: (destination) => native.connect(destination),
        disconnect: () => native.disconnect(),
        start: (when) => native.start(when),
        stop: (when) => native.stop(when),
      };
    },
  };
}
