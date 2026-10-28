import React, { useEffect } from "react";
import {
  AppState,
  Pressable,
  Text,
  View,
  TextInput,
  ScrollView,
} from "react-native";
import { createSoundEngine } from "@zemskov-space/harmonia/native";
import { SoundProvider, useSound } from "@zemskov-space/harmonia/react";

// One app-owned instance, lazy AudioContext, no microphone or audio assets.
const sound = createSoundEngine({ material: "felt", volume: 0.65 });
function Demo() {
  const { play, engine, settings } = useSound();
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") void engine.suspend();
      // play() resumes the context on the next deliberate action.
    });
    void engine.preload().catch(console.warn);
    return () => subscription.remove();
  }, [engine]);
  return (
    <View style={{ padding: 24, gap: 20 }}>
      <Pressable onPress={() => void play("tap").catch(console.warn)}>
        <Text>Мягкий тап</Text>
      </Pressable>
      <Pressable
        onPress={() => engine.configure({ enabled: !settings.enabled })}
      >
        <Text>Звук: {settings.enabled ? "включён" : "выключен"}</Text>
      </Pressable>
      <TextInput
        placeholder="Напишите что-нибудь"
        onKeyPress={({ nativeEvent }) => {
          void play(
            nativeEvent.key === "Backspace"
              ? "erase"
              : nativeEvent.key === " "
                ? "space"
                : "type",
          ).catch(console.warn);
        }}
      />
      <ScrollView
        style={{ height: 200 }}
        scrollEventThrottle={32}
        onScroll={() => void play("scroll").catch(console.warn)}
      >
        {Array.from({ length: 30 }, (_, i) => (
          <Text style={{ padding: 12 }} key={i}>
            Строка {i + 1}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
export default function App() {
  return (
    <SoundProvider engine={sound}>
      <Demo />
    </SoundProvider>
  );
}
// App shell owns lifetime. Call sound.dispose() only when permanently tearing it down.
