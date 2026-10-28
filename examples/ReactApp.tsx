import { createSoundEngine } from "@zemskov-space/harmonia";
import { SoundProvider, useSound } from "@zemskov-space/harmonia/react";
const sound = createSoundEngine({ material: "felt" });
function SaveButton() {
  const { play } = useSound();
  return (
    <button onClick={() => void play("success").catch(console.warn)}>
      Сохранить
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
