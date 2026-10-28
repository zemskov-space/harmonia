import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  createSoundEngine,
  type Material,
  type SoundName,
  presets,
  materials,
} from "@zemskov-space/harmonia";
import { SoundProvider, useSound } from "@zemskov-space/harmonia/react";

const materialDescriptions: Record<Material, string> = {
  felt: "soft and muted",
  glass: "crisp and bell-like",
  wood: "warm and tactile",
  bubble: "round and playful",
};

const planets = [
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
];

const scrollItems = [
  "Morning stillness",
  "Open window breeze",
  "Warm golden light",
  "Vinyl turning softly",
  "Coffee on the balcony",
  "Clean blank page",
  "A spark of an idea",
  "An hour of quiet",
  "Long aimless walk",
  "Calling an old friend",
  "Gentle dusk",
  "Another good thought",
  "Center of gravity",
  "A personal orbit",
  "Room for the new",
  "Time to breathe out",
];

function InteractivePlayground() {
  const { play, engine, settings, configure } = useSound();
  const [activated, setActivated] = useState(false);
  const [lastSound, setLastSound] = useState("60 SOUNDS · WEB / iOS / ANDROID");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(
      () => setToastMessage(null),
      2400,
    );
  }, []);

  const triggerSound = useCallback(
    async (
      name: SoundName | (string & {}),
      options?: Parameters<typeof play>[1],
    ) => {
      try {
        const handle = await play(name, options);
        setActivated(true);
        if (handle) {
          setLastSound(`${name} / ${engine.settings.material}`);
        }
        return handle;
      } catch (err: any) {
        showToast(`Audio unlock failed: ${err?.message || err}`);
      }
    },
    [play, engine, showToast],
  );

  // Sound toggle button in header
  const handleToggleSound = async () => {
    if (activated && settings.enabled) {
      configure({ enabled: false });
      engine.stopAll();
      await engine.suspend();
    } else {
      configure({ enabled: true });
      await triggerSound("tap");
    }
  };

  // Card 01: Touch & Hold
  const [liked, setLiked] = useState(false);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdDone, setHoldDone] = useState(false);
  const holdStartRef = useRef(0);
  const holdFrameRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);

  const startHold = () => {
    if (holding) return;
    setHolding(true);
    setHoldDone(false);
    holdStartRef.current = performance.now();
    void triggerSound("press");

    const tick = (now: number) => {
      const elapsed = now - holdStartRef.current;
      const prog = Math.min(1, elapsed / 700);
      setHoldProgress(prog * 100);
      if (prog < 1) {
        holdFrameRef.current = requestAnimationFrame(tick);
      }
    };
    holdFrameRef.current = requestAnimationFrame(tick);

    holdTimerRef.current = window.setTimeout(() => {
      setHoldDone(true);
      void triggerSound("longPress");
    }, 700);
  };

  const endHold = (cancelled = false) => {
    if (!holding) return;
    setHolding(false);
    if (holdFrameRef.current) cancelAnimationFrame(holdFrameRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setHoldProgress(0);
    if (!cancelled) {
      void triggerSound(holdDone ? "release" : "tap");
    }
  };

  // Card 02: Switches
  const [switch1, setSwitch1] = useState(false);
  const [switch2, setSwitch2] = useState(true);
  const [checked, setChecked] = useState(false);

  // Card 03: Text input
  const [note, setNote] = useState("");
  const [sentNote, setSentNote] = useState<string | null>(null);

  // Card 04: Menu & chips
  const [menuOpen, setMenuOpen] = useState(false);
  const [space, setSpace] = useState("Personal Space");
  const [mood, setMood] = useState("Calm");

  // Card 05: Accordion
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  // Card 06: Slider & Stepper
  const [frequency, setFrequency] = useState(50);
  const [satellites, setSatellites] = useState(3);

  // Card 07: Calendar
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 1));
  const [selectedDay, setSelectedDay] = useState(28);

  const daysInMonth = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const firstDayIndex = (new Date(y, m, 1).getDay() + 6) % 7;
    return { totalDays, firstDayIndex };
  }, [currentDate]);

  // Card 08: Scroll list
  const lastScrollPosRef = useRef(0);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const pos = el.scrollTop;
    const delta = Math.abs(pos - lastScrollPosRef.current);
    if (delta < 12) return;
    lastScrollPosRef.current = pos;
    if (pos <= 2 || pos + el.clientHeight >= el.scrollHeight - 2) {
      void triggerSound("scrollEdge");
    } else {
      void triggerSound("scroll", {
        intensity: Math.min(1, 0.6 + delta / 50),
        pitch: 0.8 + Math.min(delta, 60) / 120,
      });
    }
  };

  // Card 09: Sortable list
  const [tasks, setTasks] = useState([
    { id: "1", text: "Capture the idea", num: "01" },
    { id: "2", text: "Find your rhythm", num: "02" },
    { id: "3", text: "Take a mindful pause", num: "03" },
  ]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Card 11: Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);

  // Card 12: Swipe card
  const [swipeDismissed, setSwipeDismissed] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeStartRef = useRef(0);
  const swipingRef = useRef(false);

  // Card 13: Time of day tabs
  const [timeTab, setTimeTab] = useState<"morning" | "day" | "night">(
    "morning",
  );

  // Card 14: Rating & Refresh
  const [rating, setRating] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Card 15: Search
  const [searchQuery, setSearchQuery] = useState("");
  const filteredPlanets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? planets.filter((p) => p.toLowerCase().includes(q)) : planets;
  }, [searchQuery]);

  return (
    <>
      <div className="cosmos" aria-hidden="true" />
      <svg className="svg-defs" aria-hidden="true">
        <defs>
          <symbol id="mark" viewBox="0 0 32 32">
            <path
              d="M8 9v14M14 5v22M20 10v12M26 13v6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <ellipse
              cx="16"
              cy="16"
              rx="15"
              ry="7"
              transform="rotate(-40 16 16)"
              stroke="currentColor"
              strokeWidth=".6"
              fill="none"
              opacity=".6"
            />
          </symbol>
        </defs>
      </svg>

      <div className="wrap">
        <header>
          <a className="brand" href="#">
            <svg>
              <use href="#mark" />
            </svg>
            <span>
              harmonia
              <small>by zemskov.space</small>
            </span>
          </a>
          <button
            className="sound-button"
            id="soundToggle"
            aria-pressed={activated && settings.enabled}
            onClick={handleToggleSound}
          >
            <i />
            <span>
              {!settings.enabled
                ? "Sound Muted"
                : activated
                  ? "Sound Active"
                  : "Enable Sound"}
            </span>
            <span aria-hidden="true">◖))</span>
          </button>
        </header>

        <main>
          <div className="intro">
            <div className="eyebrow">THE INTERFACE IS YOUR INSTRUMENT</div>
            <h1>
              Just touch.
              <br />
              <em>And feel the difference.</em>
            </h1>
            <p>
              Tap, type, reveal, slide, and explore.
              <br />
              Every interaction is a crafted procedural acoustic sensation.
            </p>
            <div className="orbit-art" aria-hidden="true">
              <div />
              <div />
              <span>✧</span>
              <svg>
                <use href="#mark" />
              </svg>
            </div>
          </div>

          {/* Control Dock: Material & Volume */}
          <div className="control-dock glass">
            <div className="material-control">
              <div className="control-title">
                Material <span>{materialDescriptions[settings.material]}</span>
              </div>
              <div className="materials" aria-label="Sound material">
                {(["felt", "glass", "wood", "bubble"] as Material[]).map(
                  (mat) => {
                    const isSelected = settings.material === mat;
                    const icons: Record<Material, string> = {
                      felt: "◒",
                      glass: "◇",
                      wood: "▥",
                      bubble: "◯",
                    };
                    return (
                      <button
                        key={mat}
                        className={isSelected ? "selected" : ""}
                        aria-pressed={isSelected}
                        onClick={() => {
                          configure({ material: mat });
                          void triggerSound("select");
                        }}
                      >
                        <span>{icons[mat]}</span>{" "}
                        {mat.charAt(0).toUpperCase() + mat.slice(1)}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="volume-control">
              <div className="control-title">
                <label htmlFor="volume">Volume</label>
                <output>
                  {Math.round(settings.volume * 100)}%
                  {settings.volume > 1 ? " ⚡" : ""}
                </output>
              </div>
              <div className="volume-line">
                <span aria-hidden="true">◖))</span>
                <input
                  type="range"
                  id="volume"
                  min="0"
                  max="1.5"
                  step="0.01"
                  value={settings.volume}
                  style={
                    {
                      "--fill": `${(settings.volume / 1.5) * 100}%`,
                    } as React.CSSProperties
                  }
                  onChange={(e) => {
                    configure({ volume: Number(e.target.value) });
                  }}
                  onMouseUp={() => void triggerSound("tap")}
                  onTouchEnd={() => void triggerSound("tap")}
                  aria-label="Volume slider"
                />
              </div>
            </div>
          </div>

          <div className="playground-caption">
            <span>
              <i /> Live elements. Real engine.
            </span>
            <span id="lastSound">{lastSound}</span>
          </div>

          {/* 16 Interactive Cards */}
          <div className="demo-grid">
            {/* 01 / TOUCH */}
            <article className="card glass">
              <div className="card-top">
                <span>01 / TOUCH</span>
                <span>↗</span>
              </div>
              <h2>Everything starts with a tap</h2>
              <p>Different actions. Different subtle acoustic textures.</p>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => void triggerSound("tap")}
                >
                  Press me ↗
                </button>
                <button
                  className="secondary"
                  onClick={() => void triggerSound("click")}
                >
                  Click
                </button>
                <button
                  className="icon-button"
                  aria-pressed={liked}
                  onClick={() => {
                    const next = !liked;
                    setLiked(next);
                    void triggerSound(next ? "heart" : "deselect");
                  }}
                >
                  {liked ? "♥" : "♡"}
                </button>
              </div>
              <button
                className="hold-button"
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  (e.currentTarget as HTMLElement).setPointerCapture(
                    e.pointerId,
                  );
                  startHold();
                }}
                onPointerUp={() => endHold(false)}
                onPointerCancel={() => endHold(true)}
              >
                <span style={{ width: `${holdProgress}%` }} />
                <b>
                  {holding
                    ? holdDone
                      ? "Captured the feeling ✓"
                      : "Keep holding…"
                    : "Hold a little longer"}
                </b>
              </button>
              <div className="card-foot">tap · click · heart · longPress</div>
            </article>

            {/* 02 / SWITCHES */}
            <article className="card glass">
              <div className="card-top">
                <span>02 / SWITCHES</span>
                <span>◒</span>
              </div>
              <h2>Small decisions</h2>
              <p>Turn on what makes your day better.</p>
              <div className="switch-row">
                <span>
                  Do not disturb
                  <small>Time for yourself</small>
                </span>
                <button
                  className="toggle"
                  role="switch"
                  aria-checked={switch1}
                  onClick={() => {
                    const next = !switch1;
                    setSwitch1(next);
                    void triggerSound(next ? "toggleOn" : "toggleOff");
                  }}
                >
                  <i />
                </button>
              </div>
              <div className="switch-row">
                <span>
                  Light animations
                  <small>A little bit of motion</small>
                </span>
                <button
                  className="toggle"
                  role="switch"
                  aria-checked={switch2}
                  onClick={() => {
                    const next = !switch2;
                    setSwitch2(next);
                    void triggerSound(next ? "toggleOn" : "toggleOff");
                  }}
                >
                  <i />
                </button>
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setChecked(next);
                    void triggerSound(next ? "check" : "uncheck");
                  }}
                />
                <span className="check-visual">✓</span>
                Remember this feeling
              </label>
              <div className="card-foot">
                toggleOn · toggleOff · check · uncheck
              </div>
            </article>

            {/* 03 / TEXT INPUT */}
            <article className="card glass">
              <div className="card-top">
                <span>03 / TEXT INPUT</span>
                <span>⌨</span>
              </div>
              <h2>Capture a thought</h2>
              <p>Type, erase, add spaces. Organic keyboard feedback.</p>
              <textarea
                rows={3}
                placeholder="Today is a good day to…"
                maxLength={500}
                value={note}
                onFocus={() => void triggerSound("focus")}
                onBlur={() => void triggerSound("blur")}
                onChange={(e) => {
                  setNote(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace") void triggerSound("erase");
                  else if (e.key === " ") void triggerSound("space");
                  else if (e.key === "Enter") void triggerSound("enter");
                  else if (e.key.length === 1) void triggerSound("type");
                }}
              />
              <div className="note-actions">
                <span>{note.length} / 500</span>
                <button
                  className="text-button"
                  onClick={() => {
                    if (!note) return;
                    setNote("");
                    void triggerSound("erase");
                  }}
                >
                  Erase
                </button>
                <button
                  className="primary small"
                  onClick={() => {
                    const text = note.trim();
                    if (!text) {
                      void triggerSound("error");
                      showToast("Write something first");
                      return;
                    }
                    setSentNote(text);
                    setNote("");
                    void triggerSound("send");
                  }}
                >
                  Send ↗
                </button>
              </div>
              {sentNote && <div className="sent-note">✓ {sentNote}</div>}
              <div className="card-foot">
                type · space · erase · focus · send
              </div>
            </article>

            {/* 04 / MENU */}
            <article className="card glass menu-card">
              <div className="card-top">
                <span>04 / MENU</span>
                <span>⌄</span>
              </div>
              <h2>A place for your ideas</h2>
              <p>Expand the menu and select your workspace.</p>
              <button
                className="select-button"
                aria-expanded={menuOpen}
                onClick={() => {
                  const next = !menuOpen;
                  setMenuOpen(next);
                  void triggerSound(next ? "menuOpen" : "menuClose");
                }}
              >
                <span>◈ {space}</span>
                <span>⌄</span>
              </button>
              {menuOpen && (
                <div className="dropdown">
                  {["Personal Space", "Work Orbit", "New Horizons"].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSpace(s);
                        setMenuOpen(false);
                        void triggerSound("select");
                      }}
                    >
                      ◈ {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="chip-label">Mood</div>
              <div className="chips">
                {["Calm", "Flow", "Inspire"].map((m) => (
                  <button
                    key={m}
                    className={mood === m ? "selected" : ""}
                    onClick={() => {
                      setMood(m);
                      void triggerSound("select");
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="card-foot">menuOpen · menuClose · select</div>
            </article>

            {/* 05 / ACCORDION */}
            <article className="card glass">
              <div className="card-top">
                <span>05 / ACCORDION</span>
                <span>＋</span>
              </div>
              <h2>A little more inside</h2>
              <p>Expand to hear procedural transitions.</p>
              <div className="accordion">
                {[
                  {
                    title: "What is Harmonia?",
                    desc: "Procedural UI sound engine synthesized completely in TypeScript. Zero audio files, zero network calls.",
                  },
                  {
                    title: "How does it sound on mobile?",
                    desc: "Web Audio on modern browsers, and React Native Audio API with native adapters for iOS / Android.",
                  },
                  {
                    title: "Can you create custom sounds?",
                    desc: "Yes! Compose custom voice scores with damped resonators, noise filters, materials, and envelope curves.",
                  },
                ].map((item, idx) => {
                  const isOpen = openAccordion === idx;
                  return (
                    <div key={idx}>
                      <button
                        onClick={() => {
                          const next = isOpen ? null : idx;
                          setOpenAccordion(next);
                          void triggerSound(
                            next !== null ? "expand" : "collapse",
                          );
                        }}
                      >
                        {item.title}
                        <span>{isOpen ? "−" : "＋"}</span>
                      </button>
                      {isOpen && <div>{item.desc}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="card-foot">expand · collapse</div>
            </article>

            {/* 06 / SLIDER & STEPPER */}
            <article className="card glass">
              <div className="card-top">
                <span>06 / SLIDER & STEPPER</span>
                <span>≋</span>
              </div>
              <h2>Tune the frequency</h2>
              <p>Higher slider position raises the procedural pitch.</p>
              <div className="range-title">
                <label htmlFor="freq">Orbit frequency</label>
                <output>{frequency}%</output>
              </div>
              <input
                id="freq"
                type="range"
                min="0"
                max="100"
                value={frequency}
                style={{ "--fill": `${frequency}%` } as React.CSSProperties}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFrequency(val);
                  void triggerSound("slider", { pitch: 0.6 + val / 80 });
                }}
              />
              <div className="stepper-row">
                <span>Active satellites</span>
                <div className="stepper">
                  <button
                    onClick={() => {
                      if (satellites <= 0) {
                        void triggerSound("scrollEdge");
                        return;
                      }
                      const next = satellites - 1;
                      setSatellites(next);
                      void triggerSound("picker", { pitch: 0.7 + next / 18 });
                    }}
                  >
                    −
                  </button>
                  <output>{satellites}</output>
                  <button
                    onClick={() => {
                      if (satellites >= 12) {
                        void triggerSound("scrollEdge");
                        return;
                      }
                      const next = satellites + 1;
                      setSatellites(next);
                      void triggerSound("picker", { pitch: 0.7 + next / 18 });
                    }}
                  >
                    ＋
                  </button>
                </div>
              </div>
              <div className="card-foot">slider · picker · scrollEdge</div>
            </article>

            {/* 07 / CALENDAR */}
            <article className="card glass calendar-card">
              <div className="card-top">
                <span>07 / CALENDAR</span>
                <span>◷</span>
              </div>
              <div className="calendar-head">
                <button
                  onClick={() => {
                    const prev = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() - 1,
                      1,
                    );
                    setCurrentDate(prev);
                    void triggerSound("pageBack");
                  }}
                >
                  ←
                </button>
                <h2>
                  {currentDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <button
                  onClick={() => {
                    const next = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() + 1,
                      1,
                    );
                    setCurrentDate(next);
                    void triggerSound("pageNext");
                  }}
                >
                  →
                </button>
              </div>
              <div className="weekdays">
                <span>MO</span>
                <span>TU</span>
                <span>WE</span>
                <span>TH</span>
                <span>FR</span>
                <span>SA</span>
                <span>SU</span>
              </div>
              <div className="calendar-days">
                {Array.from({ length: daysInMonth.firstDayIndex }).map(
                  (_, i) => (
                    <span key={`empty-${i}`} />
                  ),
                )}
                {Array.from({ length: daysInMonth.totalDays }).map((_, i) => {
                  const day = i + 1;
                  const isSel = day === selectedDay;
                  return (
                    <button
                      key={day}
                      aria-pressed={isSel}
                      onClick={() => {
                        setSelectedDay(day);
                        void triggerSound("select");
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <div className="card-foot">pageNext · pageBack · select</div>
            </article>

            {/* 08 / SCROLL */}
            <article className="card glass">
              <div className="card-top">
                <span>08 / SCROLL</span>
                <span>↕</span>
              </div>
              <h2>Natural kinetic rhythm</h2>
              <p>Scroll the list. Dynamic pitch tracks scroll speed.</p>
              <div className="scroll-list" onScroll={handleScroll}>
                {scrollItems.map((item, idx) => (
                  <div key={idx} className="scroll-item">
                    {item}
                    <span>{String(idx + 1).padStart(2, "0")} ↗</span>
                  </div>
                ))}
              </div>
              <div className="card-foot">scroll · scrollEdge</div>
            </article>

            {/* 09 / DRAG & DROP */}
            <article className="card glass">
              <div className="card-top">
                <span>09 / DRAG & DROP</span>
                <span>⠿</span>
              </div>
              <h2>Rearrange elements</h2>
              <p>Grab the handle to reorder list items.</p>
              <div className="sortable">
                {tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className={`sort-item ${draggedIdx === idx ? "dragging" : ""}`}
                  >
                    <button
                      className="drag-handle"
                      onPointerDown={() => {
                        setDraggedIdx(idx);
                        void triggerSound("dragStart");
                      }}
                      onPointerUp={() => {
                        if (draggedIdx !== null) {
                          setDraggedIdx(null);
                          void triggerSound("drop");
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp" && idx > 0) {
                          const updated = [...tasks];
                          const temp = updated[idx - 1];
                          updated[idx - 1] = updated[idx];
                          updated[idx] = temp;
                          setTasks(updated);
                          void triggerSound("snap");
                        } else if (
                          e.key === "ArrowDown" &&
                          idx < tasks.length - 1
                        ) {
                          const updated = [...tasks];
                          const temp = updated[idx + 1];
                          updated[idx + 1] = updated[idx];
                          updated[idx] = temp;
                          setTasks(updated);
                          void triggerSound("snap");
                        }
                      }}
                    >
                      ⠿
                    </button>
                    <span>{task.text}</span>
                    <small>{task.num}</small>
                  </div>
                ))}
              </div>
              <div className="card-foot">
                dragStart · dragMove · drop · snap
              </div>
            </article>

            {/* 10 / FEEDBACK */}
            <article className="card glass">
              <div className="card-top">
                <span>10 / FEEDBACK</span>
                <span>✧</span>
              </div>
              <h2>Clear emotional tone</h2>
              <p>Instant auditory clarity for state changes.</p>
              <div className="feedback-grid">
                <button
                  onClick={() => {
                    void triggerSound("success");
                    showToast("Action completed successfully ✓");
                  }}
                >
                  <span>✓</span> Success
                </button>
                <button
                  onClick={() => {
                    void triggerSound("error");
                    showToast("Something went wrong (demo error)");
                  }}
                >
                  <span style={{ color: "#cf9cb6" }}>×</span> Error
                </button>
                <button
                  onClick={() => {
                    void triggerSound("warning");
                    showToast("Warning: Check parameters ⚠");
                  }}
                >
                  <span style={{ color: "#c8b38f" }}>△</span> Warning
                </button>
                <button
                  onClick={() => {
                    void triggerSound("notification");
                    showToast("New notification received ✧");
                  }}
                >
                  <span>✧</span> Notice
                </button>
              </div>
              <div className="card-foot">
                success · error · warning · notification
              </div>
            </article>

            {/* 11 / DIALOG */}
            <article className="card glass">
              <div className="card-top">
                <span>11 / DIALOG</span>
                <span>▱</span>
              </div>
              <h2>A brief pause</h2>
              <p>Trigger modal sheets with spatial acoustics.</p>
              <button
                className="dialog-preview"
                onClick={() => {
                  setDialogOpen(true);
                  void triggerSound("sheetOpen");
                }}
              >
                <span className="window-drawing" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>Open Dialog ↗</span>
              </button>
              <div className="card-foot">sheetOpen · sheetClose · complete</div>
            </article>

            {/* 12 / SWIPE */}
            <article className="card glass">
              <div className="card-top">
                <span>12 / SWIPE</span>
                <span>→</span>
              </div>
              <h2>Dismiss what’s finished</h2>
              <p>Swipe the card to the side to archive it.</p>
              <div className="swipe-track">
                <span className="swipe-backdrop">Release to dismiss ✧</span>
                {!swipeDismissed && (
                  <div
                    className="swipe-card"
                    style={{
                      transform: `translateX(${swipeOffset}px)`,
                    }}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      swipingRef.current = true;
                      swipeStartRef.current = e.clientX;
                      (e.currentTarget as HTMLElement).setPointerCapture(
                        e.pointerId,
                      );
                    }}
                    onPointerMove={(e) => {
                      if (!swipingRef.current) return;
                      const dx = e.clientX - swipeStartRef.current;
                      setSwipeOffset(Math.max(-260, Math.min(260, dx)));
                    }}
                    onPointerUp={() => {
                      if (!swipingRef.current) return;
                      swipingRef.current = false;
                      if (Math.abs(swipeOffset) > 65) {
                        setSwipeDismissed(true);
                        void triggerSound("delete");
                      } else {
                        void triggerSound("swipe");
                      }
                      setSwipeOffset(0);
                    }}
                  >
                    <span>◒</span>
                    <div>
                      One completed task
                      <small>Slide your finger →</small>
                    </div>
                    <b>⋯</b>
                  </div>
                )}
              </div>
              <div className="swipe-actions">
                {!swipeDismissed ? (
                  <button
                    className="text-button"
                    onClick={() => {
                      setSwipeDismissed(true);
                      void triggerSound("delete");
                    }}
                  >
                    Dismiss card →
                  </button>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => {
                      setSwipeDismissed(false);
                      void triggerSound("undo");
                    }}
                  >
                    ↶ Undo
                  </button>
                )}
              </div>
              <div className="card-foot">swipe · delete · undo</div>
            </article>

            {/* 13 / TABS */}
            <article className="card glass">
              <div className="card-top">
                <span>13 / TABS</span>
                <span>◈</span>
              </div>
              <h2>Shift perspectives</h2>
              <p>Segmented controls with page turn feedback.</p>
              <div className="segmented">
                {[
                  { key: "morning", label: "Morning", icon: "☀" },
                  { key: "day", label: "Day", icon: "◈" },
                  { key: "night", label: "Night", icon: "☾" },
                ].map((t) => (
                  <button
                    key={t.key}
                    aria-selected={timeTab === t.key}
                    onClick={() => {
                      const tabs = ["morning", "day", "night"];
                      const isNext =
                        tabs.indexOf(t.key) >= tabs.indexOf(timeTab);
                      setTimeTab(t.key as any);
                      void triggerSound(isNext ? "pageNext" : "pageBack");
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="time-panel">
                <span>
                  {timeTab === "morning" ? "☀" : timeTab === "day" ? "◈" : "☾"}
                </span>
                <p>
                  {timeTab === "morning"
                    ? "Start the day with a clean slate."
                    : timeTab === "day"
                      ? "Find your rhythm and keep the flow."
                      : "Leave a little room for silence."}
                </p>
              </div>
              <div className="card-foot">pageNext · pageBack</div>
            </article>

            {/* 14 / RATING */}
            <article className="card glass">
              <div className="card-top">
                <span>14 / RATING</span>
                <span>☆</span>
              </div>
              <h2>How does it feel?</h2>
              <p>Ascending micro-pitch scale with star rating.</p>
              <div className="rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={rating >= star ? "selected" : ""}
                    onClick={() => {
                      setRating(star);
                      void triggerSound(star === 5 ? "sparkle" : "select", {
                        pitch: 0.8 + star * 0.12,
                      });
                    }}
                  >
                    {rating >= star ? "★" : "☆"}
                  </button>
                ))}
              </div>
              <div className="rating-label">
                {
                  [
                    "",
                    "A humble beginning",
                    "Getting warmer",
                    "Feeling it now",
                    "Truly delightful",
                    "Pure acoustic harmony ✧",
                  ][rating]
                }
              </div>
              <button
                className={`secondary refresh-button ${refreshing ? "busy" : ""}`}
                disabled={refreshing}
                onClick={() => {
                  setRefreshing(true);
                  void triggerSound("refresh");
                  setTimeout(() => {
                    setRefreshing(false);
                    void triggerSound("success");
                    showToast("Mood refreshed. Ready to continue.");
                  }, 650);
                }}
              >
                <span>↻</span> Refresh mood
              </button>
              <div className="card-foot">
                sparkle · select · refresh · success
              </div>
            </article>

            {/* 15 / SEARCH */}
            <article className="card glass">
              <div className="card-top">
                <span>15 / SEARCH</span>
                <span>⌕</span>
              </div>
              <h2>Find something</h2>
              <p>Dynamic acoustic filtering and item selection.</p>
              <div className="search-field">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Find planet…"
                  value={searchQuery}
                  onFocus={() => void triggerSound("focus")}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    void triggerSound("type");
                  }}
                />
              </div>
              <div className="planet-results">
                {filteredPlanets.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      void triggerSound("select");
                      showToast(`Navigating to ${p} ↗`);
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="card-foot">focus · type · erase · select</div>
            </article>

            {/* 16 / PLAYFUL DETAILS */}
            <article className="card glass">
              <div className="card-top">
                <span>16 / PLAYFUL DETAILS</span>
                <span>✳</span>
              </div>
              <h2>A touch of whimsy</h2>
              <p>Procedural UI sounds can be delightful and fun.</p>
              <div className="playful-pads">
                <button onClick={() => void triggerSound("bubble")}>
                  <span>◯</span> Bubble
                </button>
                <button onClick={() => void triggerSound("pop")}>
                  <span>◉</span> Pop
                </button>
                <button onClick={() => void triggerSound("knock")}>
                  <span>▥</span> Knock
                </button>
                <button onClick={() => void triggerSound("breathe")}>
                  <span>≋</span> Breathe
                </button>
              </div>
              <button
                className="primary celebrate-button"
                onClick={() => {
                  void triggerSound("celebrate");
                  showToast("You did it! Small wins matter ✧");
                }}
              >
                Celebrate small victory ✧
              </button>
              <div className="card-foot">
                bubble · pop · knock · breathe · celebrate
              </div>
            </article>
          </div>

          {/* Footer */}
          <footer>
            <span>
              harmonia{" "}
              <small>
                by{" "}
                <a
                  href="https://zemskov.space"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  zemskov.space
                </a>
              </small>
            </span>
            <div>
              <a
                href="https://github.com/zemskov-space/harmonia"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button>GitHub ↗</button>
              </a>
              <button onClick={() => setLicenseDialogOpen(true)}>
                AGPL-3.0
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Modal Dialog */}
      {dialogOpen && (
        <dialog className="glass dialog" open>
          <button
            className="dialog-close icon-button"
            onClick={() => {
              setDialogOpen(false);
              void triggerSound("sheetClose");
            }}
          >
            ×
          </button>
          <div className="dialog-symbol">✧</div>
          <h2>Leave room for good things</h2>
          <p>
            This is a demonstration modal sheet.
            <br />
            Confirm or simply close to hear spatial acoustic cues.
          </p>
          <div className="dialog-actions">
            <button
              className="secondary"
              onClick={() => {
                setDialogOpen(false);
                void triggerSound("sheetClose");
              }}
            >
              Return
            </button>
            <button
              className="primary"
              onClick={() => {
                setDialogOpen(false);
                void triggerSound("complete");
                showToast("There is always room for good things ✧");
              }}
            >
              Confirm ↗
            </button>
          </div>
        </dialog>
      )}

      {/* License Dialog */}
      {licenseDialogOpen && (
        <dialog className="glass license-dialog" open>
          <button
            className="dialog-close icon-button"
            onClick={() => setLicenseDialogOpen(false)}
          >
            ×
          </button>
          <h2>Harmonia · AGPL-3.0-only</h2>
          <p>Copyright © 2026 Alexander Zemskov · zemskov.space</p>
          <p>
            Harmonia is licensed under the GNU Affero General Public License v3.
            Commercial licenses are available via{" "}
            <a href="https://zemskov.space" target="_blank" rel="noreferrer">
              zemskov.space
            </a>
            .
          </p>
        </dialog>
      )}

      {/* Toast */}
      <div id="toast" className={toastMessage ? "show" : ""} role="status">
        {toastMessage}
      </div>
    </>
  );
}

export function App() {
  const engine = useMemo(
    () =>
      createSoundEngine({
        volume: 0.5,
        material: "felt",
        maxVoices: 6,
      }),
    [],
  );

  return (
    <SoundProvider engine={engine}>
      <InteractivePlayground />
    </SoundProvider>
  );
}
