// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2026 Alexander Zemskov, zemskov.space
/** A sound is a small score of damped resonators and filtered noise. Seconds / Hz. */
export interface Voice {
  at?: number;
  duration: number;
  frequency: number;
  endFrequency?: number;
  gain?: number;
  noise?: number;
  harmonics?: number;
  attack?: number;
}
export interface SoundDefinition {
  label: string;
  category: string;
  voices: readonly Voice[];
  cooldown?: number;
  group?: string;
}
const v = (
  frequency: number,
  duration = 0.065,
  gain = 1,
  at = 0,
  extra: Partial<Voice> = {},
): Voice => ({ frequency, duration, gain, at, ...extra });
const s = (
  label: string,
  category: string,
  voices: Voice[],
  cooldown = 28,
  group?: string,
): SoundDefinition => ({ label, category, voices, cooldown, group });
export const presets = {
  tap: s("Мягкий тап", "Touch", [
    v(640, 0.048, 0.65),
    v(230, 0.035, 0.55, 0, { noise: 0.12 }),
  ]),
  click: s("Щелчок", "Touch", [
    v(1080, 0.034, 0.7, 0, { noise: 0.2 }),
    v(360, 0.04, 0.5),
  ]),
  press: s("Нажатие", "Touch", [v(380, 0.055, 0.8, 0, { endFrequency: 290 })]),
  release: s("Отпускание", "Touch", [
    v(570, 0.045, 0.65, 0, { endFrequency: 730 }),
  ]),
  toggleOn: s("Включение", "Touch", [
    v(620, 0.05, 0.65),
    v(920, 0.09, 0.7, 0.035),
  ]),
  toggleOff: s("Выключение", "Touch", [
    v(750, 0.05, 0.65),
    v(430, 0.08, 0.7, 0.035),
  ]),
  select: s("Выбор", "Touch", [
    v(850, 0.075, 0.65),
    v(1275, 0.085, 0.2, 0.012),
  ]),
  deselect: s("Снятие выбора", "Touch", [
    v(680, 0.05, 0.6),
    v(460, 0.055, 0.4, 0.018),
  ]),
  check: s("Готово", "Touch", [v(740, 0.08, 0.6), v(1110, 0.13, 0.55, 0.045)]),
  uncheck: s("Снять отметку", "Touch", [
    v(880, 0.055, 0.5),
    v(590, 0.07, 0.55, 0.025),
  ]),
  hover: s(
    "Наведение",
    "Touch",
    [v(1100, 0.025, 0.25, 0, { noise: 0.15 })],
    90,
  ),
  longPress: s("Удержание", "Touch", [
    v(330, 0.13, 0.7, 0, { endFrequency: 660 }),
    v(990, 0.1, 0.25, 0.06),
  ]),
  menuOpen: s("Открыть меню", "Motion", [
    v(330, 0.15, 0.65, 0, { endFrequency: 690, noise: 0.16 }),
    v(990, 0.12, 0.2, 0.04),
  ]),
  menuClose: s("Закрыть меню", "Motion", [
    v(620, 0.12, 0.6, 0, { endFrequency: 280, noise: 0.15 }),
  ]),
  expand: s("Развернуть", "Motion", [
    v(440, 0.15, 0.65, 0, { endFrequency: 880 }),
    v(1320, 0.12, 0.2, 0.05),
  ]),
  collapse: s("Свернуть", "Motion", [
    v(880, 0.13, 0.6, 0, { endFrequency: 440 }),
  ]),
  sheetOpen: s("Поднять панель", "Motion", [
    v(220, 0.21, 0.65, 0, { endFrequency: 660, noise: 0.18 }),
  ]),
  sheetClose: s("Убрать панель", "Motion", [
    v(550, 0.17, 0.6, 0, { endFrequency: 160, noise: 0.16 }),
  ]),
  swipe: s(
    "Свайп",
    "Motion",
    [v(500, 0.11, 0.45, 0, { endFrequency: 1100, noise: 0.65 })],
    90,
  ),
  pageNext: s("Следующая страница", "Motion", [
    v(540, 0.07, 0.5),
    v(810, 0.1, 0.5, 0.04),
  ]),
  pageBack: s("Предыдущая страница", "Motion", [
    v(810, 0.07, 0.5),
    v(540, 0.1, 0.5, 0.04),
  ]),
  dragStart: s("Захват", "Motion", [
    v(290, 0.07, 0.7, 0, { endFrequency: 430 }),
  ]),
  dragMove: s(
    "Перемещение",
    "Motion",
    [v(410, 0.028, 0.3, 0, { noise: 0.45 })],
    65,
    "drag",
  ),
  drop: s("Отпустить объект", "Motion", [
    v(180, 0.11, 0.8, 0, { endFrequency: 100, noise: 0.15 }),
    v(630, 0.06, 0.25, 0.02),
  ]),
  snap: s("Привязка", "Motion", [v(720, 0.04, 0.65, 0, { noise: 0.15 })]),
  scroll: s(
    "Прокрутка",
    "Scroll",
    [v(480, 0.025, 0.25, 0, { noise: 0.45 })],
    48,
    "scroll",
  ),
  scrollTick: s(
    "Шаг прокрутки",
    "Scroll",
    [v(760, 0.022, 0.38, 0, { noise: 0.2 })],
    42,
    "scroll",
  ),
  scrollEdge: s(
    "Край списка",
    "Scroll",
    [v(155, 0.13, 0.65, 0, { endFrequency: 90 })],
    180,
  ),
  picker: s(
    "Колесо выбора",
    "Scroll",
    [v(910, 0.032, 0.45, 0, { noise: 0.12 })],
    45,
    "scroll",
  ),
  slider: s("Деление слайдера", "Scroll", [v(690, 0.025, 0.32)], 45, "slider"),
  refresh: s(
    "Обновление",
    "Scroll",
    [v(440, 0.1, 0.4), v(660, 0.1, 0.4, 0.06), v(880, 0.16, 0.45, 0.12)],
    350,
  ),
  type: s(
    "Ввод символа",
    "Keyboard",
    [v(850, 0.024, 0.34, 0, { noise: 0.3 }), v(260, 0.025, 0.3)],
    35,
    "typing",
  ),
  space: s(
    "Пробел",
    "Keyboard",
    [v(320, 0.037, 0.4, 0, { noise: 0.35 })],
    35,
    "typing",
  ),
  erase: s(
    "Удаление",
    "Keyboard",
    [v(620, 0.035, 0.45, 0, { endFrequency: 300, noise: 0.3 })],
    35,
    "typing",
  ),
  enter: s("Ввод строки", "Keyboard", [
    v(380, 0.045, 0.5),
    v(760, 0.075, 0.45, 0.025),
  ]),
  focus: s(
    "Фокус поля",
    "Keyboard",
    [v(570, 0.07, 0.35, 0, { endFrequency: 720 })],
    80,
  ),
  blur: s(
    "Выход из поля",
    "Keyboard",
    [v(680, 0.06, 0.3, 0, { endFrequency: 490 })],
    80,
  ),
  copy: s("Копирование", "Keyboard", [
    v(900, 0.04, 0.4),
    v(1200, 0.07, 0.4, 0.035),
  ]),
  paste: s("Вставка", "Keyboard", [
    v(680, 0.045, 0.45),
    v(510, 0.075, 0.4, 0.03),
  ]),
  undo: s("Отмена действия", "Keyboard", [
    v(900, 0.12, 0.4, 0, { endFrequency: 450 }),
  ]),
  success: s(
    "Успех",
    "Feedback",
    [
      v(523.25, 0.16, 0.45),
      v(659.25, 0.19, 0.45, 0.075),
      v(783.99, 0.3, 0.5, 0.15),
    ],
    240,
  ),
  error: s(
    "Ошибка",
    "Feedback",
    [v(220, 0.13, 0.5, 0, { harmonics: 0.3 }), v(185, 0.18, 0.5, 0.12)],
    250,
  ),
  warning: s(
    "Предупреждение",
    "Feedback",
    [v(520, 0.13, 0.45), v(520, 0.18, 0.4, 0.15)],
    250,
  ),
  notification: s(
    "Уведомление",
    "Feedback",
    [v(880, 0.25, 0.4), v(1320, 0.32, 0.28, 0.08)],
    250,
  ),
  message: s(
    "Сообщение",
    "Feedback",
    [v(700, 0.08, 0.5, 0, { endFrequency: 1000 }), v(1400, 0.16, 0.2, 0.04)],
    180,
  ),
  send: s(
    "Отправка",
    "Feedback",
    [v(360, 0.15, 0.5, 0, { endFrequency: 1200, noise: 0.18 })],
    180,
  ),
  receive: s(
    "Получение",
    "Feedback",
    [v(1200, 0.15, 0.4, 0, { endFrequency: 600 }), v(900, 0.15, 0.25, 0.07)],
    180,
  ),
  complete: s(
    "Завершение",
    "Feedback",
    [v(587, 0.18, 0.4), v(880, 0.22, 0.4, 0.08), v(1174, 0.38, 0.35, 0.16)],
    300,
  ),
  delete: s("Удалить объект", "Feedback", [
    v(430, 0.16, 0.55, 0, { endFrequency: 80, noise: 0.3 }),
  ]),
  cancel: s("Отмена", "Feedback", [
    v(600, 0.065, 0.4),
    v(400, 0.1, 0.4, 0.045),
  ]),
  lock: s("Блокировка", "Feedback", [
    v(240, 0.07, 0.6, 0, { noise: 0.2 }),
    v(480, 0.05, 0.3, 0.035),
  ]),
  unlock: s("Разблокировка", "Feedback", [
    v(480, 0.055, 0.4),
    v(960, 0.12, 0.35, 0.04),
  ]),
  pop: s("Пузырёк", "Playful", [v(340, 0.1, 0.7, 0, { endFrequency: 900 })]),
  bubble: s("Капля", "Playful", [v(1050, 0.16, 0.5, 0, { endFrequency: 350 })]),
  sparkle: s("Искра", "Playful", [
    v(1568, 0.16, 0.3),
    v(2093, 0.16, 0.2, 0.04),
    v(2637, 0.2, 0.15, 0.08),
  ]),
  heart: s(
    "Сердце",
    "Playful",
    [v(140, 0.09, 0.7), v(190, 0.13, 0.65, 0.13)],
    300,
  ),
  tick: s("Тик", "Playful", [v(1400, 0.018, 0.35, 0, { noise: 0.2 })], 40),
  knock: s("Стук", "Playful", [
    v(210, 0.07, 0.65, 0, { noise: 0.1, harmonics: 0.5 }),
  ]),
  breathe: s(
    "Дыхание",
    "Playful",
    [v(260, 0.65, 0.3, 0, { endFrequency: 420, noise: 0.65, attack: 0.18 })],
    700,
  ),
  celebrate: s(
    "Праздник",
    "Playful",
    [
      v(523, 0.16, 0.35),
      v(659, 0.16, 0.35, 0.08),
      v(784, 0.2, 0.35, 0.16),
      v(1046, 0.4, 0.4, 0.25),
    ],
    500,
  ),
} satisfies Record<string, SoundDefinition>;
export type SoundName = keyof typeof presets;
export const materials = {
  felt: {
    label: "Felt",
    pitch: 0.85,
    brightness: 0.12,
    decay: 0.8,
    noise: 0.7,
  },
  glass: {
    label: "Glass",
    pitch: 1.45,
    brightness: 0.72,
    decay: 1.45,
    noise: 0.18,
  },
  wood: { label: "Wood", pitch: 0.7, brightness: 0.5, decay: 0.65, noise: 1.2 },
  bubble: {
    label: "Bubble",
    pitch: 1.12,
    brightness: 0.22,
    decay: 1.1,
    noise: 0.22,
  },
} as const;
export type Material = keyof typeof materials;
