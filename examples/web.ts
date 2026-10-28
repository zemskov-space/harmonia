import { createSoundEngine } from "@zemskov-space/harmonia";
const sound = createSoundEngine({ material: "felt", volume: 0.65 });
// Run in a browser project (Vite, Astro client script, Next client component, etc.).
const button = document.querySelector<HTMLButtonElement>("#play");
button?.addEventListener("click", async () => {
  await sound.unlock();
  await sound.play("tap");
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) void sound.suspend();
});
