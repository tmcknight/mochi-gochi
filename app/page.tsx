"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Mochi from "@/components/Mochi";
import { usePet } from "@/lib/usePet";
import type { Mood } from "@/lib/types";

type Particle = { id: number; x: number; y: number; dx: number; dy: number; emoji: string };

const moodCopy: Record<Mood, { label: string; sub: string; bodyColor: string; cheek: string }> = {
  ecstatic: { label: "ECSTATIC!!", sub: "they are vibrating with joy ✿",     bodyColor: "#FFB5A7", cheek: "#FF6B6B" },
  happy:    { label: "happy",      sub: "all is well in mochi-land",          bodyColor: "#FFB5A7", cheek: "#FF6B6B" },
  neutral:  { label: "okay",       sub: "could use a lil attention",          bodyColor: "#F4C5B0", cheek: "#FFB5A7" },
  sad:      { label: "sad",        sub: "you forgot about them...",           bodyColor: "#C8C5D0", cheek: "#A89FB5" },
  sleepy:   { label: "snoozing",   sub: "shhh — recharging",                  bodyColor: "#D4C5F9", cheek: "#FFB5A7" },
  hungry:   { label: "HUNGRY",     sub: "tummy says feed me 🍓",               bodyColor: "#F4C5B0", cheek: "#FFB5A7" },
  queasy:   { label: "queasy...",  sub: "stop shaking. they don't feel good", bodyColor: "#C8E6C9", cheek: "#A8C8A8" },
  sick:     { label: "SICK ;_;",   sub: "you shook them stupid. give meds!",  bodyColor: "#A8C9A8", cheek: "#7FA87F" },
};

export default function Page() {
  const { state, mood, hydrated, pet, feed, shake, clean, medicate, toggleSleep, reset, pukeEvent, consumePuke, hatch } = usePet();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [rumble, setRumble] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [motionNeedsPermission, setMotionNeedsPermission] = useState(false);
  const [motionTilt, setMotionTilt] = useState({ x: 0, y: 0, rot: 0 });
  const [exploded, setExploded] = useState(false);
  const [flash, setFlash] = useState(false);
  const stressRef = useRef(0);
  const explodedRef = useRef(false);
  const sickRef = useRef(false);
  const hatchedRef = useRef(true);
  const [hatchProgress, setHatchProgress] = useState(0);
  const [hatching, setHatching] = useState(false);
  const hatchProgressRef = useRef(0);
  const dragRef = useRef<{ startX: number; startY: number; lastX: number; lastY: number; lastDir: number; flips: number; lastFlipAt: number } | null>(null);
  const petAreaRef = useRef<HTMLDivElement>(null);
  const moodInfo = moodCopy[mood];

  const burstParticles = (emoji: string, count = 8, ox = 0, oy = 0) => {
    const next: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: 50 + ox,
      y: 50 + oy,
      dx: (Math.random() - 0.5) * 220,
      dy: -60 - Math.random() * 180,
      emoji,
    }));
    setParticles((p) => [...p, ...next]);
    setTimeout(() => {
      setParticles((p) => p.filter((q) => !next.find((n) => n.id === q.id)));
    }, 1000);
  };

  const handlePet = () => {
    pet();
    burstParticles("♡", 6);
  };

  const handleFeed = () => {
    feed();
    const treats = ["🍓", "🍡", "🥛", "🍪"];
    burstParticles(treats[Math.floor(Math.random() * treats.length)], 5);
  };

  const handleClean = () => {
    clean();
    burstParticles("✦", 8);
  };

  const handleSleep = () => {
    toggleSleep();
  };

  const handleShakeAction = () => {
    if (!hatchedRef.current) {
      bumpHatch(25);
      setRumble(true);
      setTimeout(() => setRumble(false), 450);
      burstParticles("✦", 5);
      return;
    }
    shake(2);
    setRumble(true);
    setTimeout(() => setRumble(false), 450);
    burstParticles("✿", 7);
    if (sickRef.current) stressRef.current += 22;
  };

  const handleMedicate = () => {
    medicate();
    burstParticles("✚", 6);
  };

  // puke burst whenever pukeEvent fires
  useEffect(() => {
    if (!pukeEvent) return;
    const drops: Particle[] = Array.from({ length: 14 }).map((_, i) => ({
      id: pukeEvent.id + i + Math.random(),
      x: 50,
      y: 56,
      dx: (Math.random() - 0.5) * 280,
      dy: 80 + Math.random() * 120,
      emoji: ["🤢", "💧", "🟢"][Math.floor(Math.random() * 3)],
    }));
    setParticles((p) => [...p, ...drops]);
    setRumble(true);
    setTimeout(() => setRumble(false), 600);
    setTimeout(() => {
      setParticles((p) => p.filter((q) => !drops.find((d) => d.id === q.id)));
    }, 1200);
    consumePuke();
  }, [pukeEvent, consumePuke]);

  // pointer-based drag/shake
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastDir: 0,
      flips: 0,
      lastFlipAt: Date.now(),
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setDragOffset({ x: Math.max(-60, Math.min(60, dx * 0.5)), y: Math.max(-40, Math.min(40, dy * 0.4)) });

    const moveDx = e.clientX - d.lastX;
    const dir = Math.sign(moveDx);
    if (dir !== 0 && dir !== d.lastDir && Math.abs(moveDx) > 6) {
      d.flips += 1;
      d.lastDir = dir;
      const now = Date.now();
      if (d.flips >= 4 && now - d.lastFlipAt < 600) {
        shake(1.5);
        burstParticles(Math.random() > 0.5 ? "♡" : "✿", 3);
        d.flips = 0;
        d.lastFlipAt = now;
        if (sickRef.current) stressRef.current += 14;
        if (!hatchedRef.current) bumpHatch(18);
      }
    }
    d.lastX = e.clientX;
    d.lastY = e.clientY;
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setDragOffset({ x: 0, y: 0 });
  };

  // track hatched state for refs accessed in event handlers
  useEffect(() => {
    hatchedRef.current = state.hatched;
    if (state.hatched) {
      hatchProgressRef.current = 0;
      setHatchProgress(0);
    }
  }, [state.hatched]);

  const triggerHatch = useCallback(() => {
    setHatching((h) => {
      if (h) return h;
      setRumble(true);
      ["✦", "♡", "✿", "🌟", "💫"].forEach((e, i) =>
        setTimeout(() => burstParticles(e, 12), i * 90)
      );
      setTimeout(() => {
        hatch();
        setHatching(false);
        setRumble(false);
      }, 1100);
      return true;
    });
  }, [hatch]);

  const bumpHatch = useCallback(
    (amount: number) => {
      if (hatchedRef.current) return;
      hatchProgressRef.current = Math.min(100, hatchProgressRef.current + amount);
      setHatchProgress(hatchProgressRef.current);
      if (hatchProgressRef.current >= 100) {
        triggerHatch();
      }
    },
    [triggerHatch]
  );

  // detect iOS permission requirement
  useEffect(() => {
    const DME = (typeof window !== "undefined" ? (window as any).DeviceMotionEvent : undefined);
    if (DME && typeof DME.requestPermission === "function") {
      setMotionNeedsPermission(true);
    } else if (typeof window !== "undefined") {
      setMotionEnabled(true);
    }
  }, []);

  // device shake (mobile)
  useEffect(() => {
    if (!motionEnabled) return;
    let last = 0;
    let raf = 0;
    let tx = 0, ty = 0, tr = 0;
    let target = { x: 0, y: 0, rot: 0 };
    const GRAVITY = 9.81;

    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.acceleration ?? e.accelerationIncludingGravity;
      if (!a) return;
      const ax = a.x ?? 0;
      const ay = a.y ?? 0;
      const az = a.z ?? 0;
      // strip gravity if only accelerationIncludingGravity available
      const usingGravity = !e.acceleration;
      const linMag = usingGravity
        ? Math.max(0, Math.hypot(ax, ay, az) - GRAVITY)
        : Math.hypot(ax, ay, az);

      // proportional tilt: clamp accel to ~25 m/s², map to ±24px / ±12deg
      const k = Math.min(linMag, 25) / 25;
      target = {
        x: Math.max(-24, Math.min(24, ax * 1.6)) * (0.4 + 0.6 * k),
        y: Math.max(-24, Math.min(24, -ay * 1.6)) * (0.4 + 0.6 * k),
        rot: Math.max(-14, Math.min(14, ax * 0.9)) * (0.4 + 0.6 * k),
      };

      // accumulate stress proportional to motion (only when sick)
      if (sickRef.current) {
        stressRef.current += Math.min(linMag, 30) * 0.18;
      }
      // hatching progress
      if (!hatchedRef.current) {
        bumpHatch(Math.min(linMag, 30) * 0.6);
      }

      if (linMag > 18 && Date.now() - last > 400) {
        last = Date.now();
        shake(2);
        setRumble(true);
        setTimeout(() => setRumble(false), 450);
        burstParticles("✿", 6);
      }
    };

    const tick = () => {
      // critically-damped follow + decay toward 0
      tx += (target.x - tx) * 0.35;
      ty += (target.y - ty) * 0.35;
      tr += (target.rot - tr) * 0.35;
      target.x *= 0.82;
      target.y *= 0.82;
      target.rot *= 0.82;
      setMotionTilt({ x: tx, y: ty, rot: tr });
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("devicemotion", onMotion);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("devicemotion", onMotion);
      cancelAnimationFrame(raf);
    };
  }, [shake, motionEnabled, bumpHatch]);

  const triggerExplosion = useCallback(() => {
    if (explodedRef.current) return;
    explodedRef.current = true;
    setExploded(true);
    setFlash(true);
    setRumble(true);
    // mega particle burst
    const blasts = ["💥", "🔥", "💔", "✨", "💫", "⚡"];
    blasts.forEach((emoji, i) => {
      setTimeout(() => burstParticles(emoji, 14), i * 60);
    });
    setTimeout(() => setFlash(false), 900);
    setTimeout(() => {
      reset();
      setExploded(false);
      explodedRef.current = false;
      stressRef.current = 0;
      setRumble(false);
    }, 2200);
  }, [reset]);

  // reset stress when not sick (only sick pet can be shaken to death)
  useEffect(() => {
    sickRef.current = state.sick;
    if (!state.sick) stressRef.current = 0;
  }, [state.sick]);

  // shake-stress accumulator → explode if too much (sick only)
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      stressRef.current = Math.max(0, stressRef.current - 0.6);
      if (stressRef.current >= 100 && !explodedRef.current) {
        triggerExplosion();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [triggerExplosion]);

  const enableMotion = async () => {
    const DME = (window as any).DeviceMotionEvent;
    if (DME && typeof DME.requestPermission === "function") {
      try {
        const res = await DME.requestPermission();
        if (res === "granted") {
          setMotionEnabled(true);
          setMotionNeedsPermission(false);
        }
      } catch {}
    } else {
      setMotionEnabled(true);
      setMotionNeedsPermission(false);
    }
  };

  if (!hydrated) {
    return (
      <main className="relative z-10 min-h-screen flex items-center justify-center">
        <p className="font-display text-3xl">waking up mochi…</p>
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-screen overflow-hidden">
      {/* decorative floating blobs */}
      <DecorBlobs />

      <div className="relative mx-auto max-w-6xl px-5 py-8 md:py-12">
        {/* header */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="card-chunk px-4 py-2 tilted bg-butter">
              <span className="font-display text-2xl md:text-3xl font-black">mochi</span>
              <span className="ml-2 text-xs md:text-sm font-bold uppercase tracking-widest">.pet</span>
            </div>
            <div className="hidden sm:block card-chunk px-3 py-2 tilted-r bg-mint text-xs font-black uppercase tracking-widest">
              v0.1 · alive
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="card-chunk px-3 py-2 bg-white text-xs font-black uppercase tracking-widest">
              age · {state.age.toFixed(2)}d
            </div>
            <button
              onClick={() => {
                if (confirm("Reset Mochi? Your blob will lose all memories ;_;")) reset();
              }}
              className="card-chunk px-3 py-2 bg-white text-xs font-black uppercase tracking-widest hover:bg-coral hover:text-white transition-colors"
            >
              reset
            </button>
          </div>
        </header>

        {/* main grid */}
        <section className="grid lg:grid-cols-[1fr_minmax(0,1.4fr)_1fr] gap-6 items-start">
          {/* left — stats */}
          <aside className="card-chunk p-5 bg-white order-2 lg:order-1">
            <h2 className="font-display text-2xl font-black mb-1">vitals</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-5">how mochi feels</p>
            <div className="space-y-4">
              <Stat label="happiness" value={state.happiness} color="bg-peach" emoji="♡" />
              <Stat label="fullness" value={state.hunger} color="bg-butter" emoji="🍓" />
              <Stat label="energy" value={state.energy} color="bg-mint" emoji="✦" />
              <Stat label="clean" value={state.cleanliness} color="bg-lavender" emoji="✿" />
              <Stat
                label="tummy"
                value={state.motionSickness}
                color={state.motionSickness > 65 ? "bg-mintDeep" : "bg-mint"}
                emoji="🤢"
                inverted
                warning={state.motionSickness > 65}
              />
            </div>

            <div className="mt-6 card-chunk p-4 bg-cream tilted-r">
              <p className="text-xs font-bold uppercase tracking-widest mb-1">mood</p>
              <p className="font-display text-3xl font-black leading-none">{moodInfo.label}</p>
              <p className="text-sm font-semibold text-ink/70 mt-2">{moodInfo.sub}</p>
            </div>
          </aside>

          {/* center — pet stage */}
          <div className="order-1 lg:order-2">
            <div
              ref={petAreaRef}
              className={`relative card-chunk bg-cream dot-grid p-6 md:p-10 aspect-square pet-cursor select-none ${rumble ? "rumble" : ""} ${flash ? "flash" : ""}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={state.hatched ? handlePet : undefined}
            >
              {/* corner badges */}
              <div className="absolute -top-4 -left-4 z-20 rounded-3xl border-[3px] border-ink shadow-chunkSm bg-coral text-white font-display text-sm font-black px-3 py-1" style={{ transform: "rotate(-6deg)" }}>
                {state.hatched ? "drag me!" : "shake me!"}
              </div>
              <div className="absolute -top-4 -right-4 z-20 rounded-3xl border-[3px] border-ink shadow-chunkSm bg-mint font-display text-sm font-black px-3 py-1" style={{ transform: "rotate(6deg)" }}>
                {state.hatched ? "tap to pet" : `${Math.round(hatchProgress)}%`}
              </div>

              {/* pet */}
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{
                  transform: `translate(${dragOffset.x + motionTilt.x}px, ${dragOffset.y + motionTilt.y}px) rotate(${motionTilt.rot}deg)`,
                  transition: dragRef.current || motionEnabled ? "none" : "transform 0.5s cubic-bezier(.18,.89,.32,1.28)",
                }}
              >
                {!state.hatched ? (
                  <Egg progress={hatchProgress} hatching={hatching} />
                ) : (
                  <div className={`w-3/4 h-3/4 ${exploded ? "exploding" : "animate-bob"}`}>
                    <Mochi
                      mood={mood}
                      color={state.variant?.bodyColor ?? moodInfo.bodyColor}
                      cheekColor={moodInfo.cheek}
                      blushIntensity={state.happiness / 100}
                      shape={state.variant?.shape}
                      ears={state.variant?.ears}
                    />
                  </div>
                )}
                {exploded && (
                  <div
                    className="boom-pop absolute left-1/2 top-1/2 font-display font-black text-6xl md:text-8xl text-coral pointer-events-none z-30"
                    style={{ textShadow: "0 0 24px #FFE066, 0 0 8px #FF6B6B" }}
                  >
                    💥 BOOM 💥
                  </div>
                )}
              </div>

              {/* particle layer */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {particles.map((p) => (
                  <span
                    key={p.id}
                    className="sparkle absolute font-display font-black text-2xl md:text-3xl"
                    style={
                      {
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        color: ["#FF6B6B", "#FF8A75", "#7FCBA0", "#FFE066"][Math.floor(Math.random() * 4)],
                        ["--dx" as any]: `${p.dx}px`,
                        ["--dy" as any]: `${p.dy}px`,
                      } as React.CSSProperties
                    }
                  >
                    {p.emoji}
                  </span>
                ))}
              </div>

              {/* footer hint */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 card-chunk bg-white px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-chunkSm">
                {state.hatched
                  ? "drag side-to-side to shake silly"
                  : hatching
                  ? "hatching!!"
                  : "shake to hatch — phone or drag!"}
              </div>
              {!state.hatched && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-3/4 max-w-xs">
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill bg-coral" style={{ width: `${hatchProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* right — actions */}
          <aside className="card-chunk p-5 bg-white order-3">
            <h2 className="font-display text-2xl font-black mb-1">{state.hatched ? "care kit" : "egg mode"}</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-5">{state.hatched ? "love your blob" : "shake to hatch"}</p>
            {motionNeedsPermission && (
              <button
                onClick={enableMotion}
                className="btn-chunk w-full bg-mint mb-3"
              >
                <span className="text-lg">📳</span>
                <span>enable shake</span>
              </button>
            )}
            {!state.hatched ? (
              <div className="space-y-3">
                <button onClick={handleShakeAction} className="btn-chunk w-full bg-mint">
                  <span className="text-xl">✿</span>
                  <span>shake!</span>
                </button>
                <div className="card-chunk p-4 bg-cream tilted">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">hatch progress</p>
                  <p className="font-display text-3xl font-black leading-none">{Math.round(hatchProgress)}%</p>
                  <p className="text-sm font-semibold text-ink/70 mt-2">
                    {hatchProgress < 25
                      ? "something stirs inside…"
                      : hatchProgress < 60
                      ? "cracks forming! keep going!"
                      : hatchProgress < 95
                      ? "almost! shake harder!"
                      : "🌟 it's hatching!! 🌟"}
                  </p>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-3">
              <ActionButton onClick={handlePet} bg="bg-peach" emoji="♡" label="pet" />
              <ActionButton onClick={handleFeed} bg="bg-butter" emoji="🍓" label="feed" />
              <ActionButton onClick={handleShakeAction} bg="bg-mint" emoji="✿" label="shake!" />
              <ActionButton onClick={handleClean} bg="bg-lavender" emoji="✦" label="bathe" />
              {state.sick ? (
                <button
                  onClick={handleMedicate}
                  className="btn-chunk col-span-2 bg-coral text-white animate-pulse"
                >
                  <span className="text-xl">✚</span>
                  <span>give meds!</span>
                </button>
              ) : (
                <button
                  onClick={handleSleep}
                  className={`btn-chunk col-span-2 ${state.asleep ? "bg-coral text-white" : "bg-ink text-cream"}`}
                >
                  <span className="text-lg">{state.asleep ? "☼" : "☾"}</span>
                  <span>{state.asleep ? "wake up" : "tuck in"}</span>
                </button>
              )}
            </div>
            )}

            <div
              className="mt-5 rounded-3xl border-[3px] border-ink shadow-chunk p-4 tilted"
              style={{
                background: state.sick ? "#FF6B6B" : state.motionSickness > 65 ? "#7FCBA0" : "#FFF5E4",
                color: state.sick ? "#fff" : "#2D2A32",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-2">
                {!state.hatched ? "egg-tip" : state.sick ? "warning" : state.motionSickness > 65 ? "careful!" : "mochi-tip"}
              </p>
              <p className="text-sm font-semibold leading-snug">
                {!state.hatched
                  ? "shake the device (or drag the egg back & forth). a mochi sleeps inside."
                  : state.sick
                  ? "you shook them too hard. they puked. give them meds OR a long sleep + bath to recover."
                  : state.motionSickness > 65
                  ? "mochi looks green. STOP shaking — one more and they're gonna hurl."
                  : "neglect them & they get sad. shake gently for giggles — too much = puke. on phone, actually shake the device!"}
              </p>
            </div>
          </aside>
        </section>

        {/* footer */}
        <footer className="mt-10 flex flex-wrap justify-between items-center gap-3 text-xs font-bold uppercase tracking-widest text-ink/60">
          <p>made with ♡ + grain — your blob, your rules</p>
          <p>autosaves locally · close tab anytime</p>
        </footer>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  color,
  emoji,
  inverted = false,
  warning = false,
}: {
  label: string;
  value: number;
  color: string;
  emoji: string;
  inverted?: boolean;
  warning?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className={`font-display text-lg font-black ${warning ? "text-coral animate-pulse" : ""}`}>
          <span className="mr-1.5">{emoji}</span>
          {label}
        </span>
        <span className="font-mono text-xs font-bold tabular-nums text-ink/60">{Math.round(value)}{inverted ? "" : ""}</span>
      </div>
      <div className="stat-bar-track">
        <div className={`stat-bar-fill ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Egg({ progress, hatching }: { progress: number; hatching: boolean }) {
  const wobble = Math.min(1, progress / 100);
  const cracks = Math.floor((progress / 100) * 5);
  return (
    <div
      className={`w-3/4 h-3/4 flex items-center justify-center ${hatching ? "exploding" : "animate-bob"}`}
      style={{
        animation: hatching
          ? undefined
          : `egg-wobble ${1.4 - wobble}s ease-in-out infinite`,
      }}
    >
      <svg viewBox="0 0 200 240" className="w-full h-full">
        <defs>
          <radialGradient id="egg-grad" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#FFFBEA" />
            <stop offset="60%" stopColor="#FFE9B0" />
            <stop offset="100%" stopColor="#F4C15A" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="130" rx="78" ry="100" fill="url(#egg-grad)" stroke="#2D2A32" strokeWidth="6" />
        {/* polka dots */}
        <circle cx="70" cy="90" r="8" fill="#FF6B6B" stroke="#2D2A32" strokeWidth="3" />
        <circle cx="135" cy="120" r="6" fill="#7FCBA0" stroke="#2D2A32" strokeWidth="3" />
        <circle cx="80" cy="170" r="7" fill="#D4C5F9" stroke="#2D2A32" strokeWidth="3" />
        <circle cx="130" cy="200" r="5" fill="#FFE066" stroke="#2D2A32" strokeWidth="3" />
        {/* progressive cracks */}
        {cracks >= 1 && <path d="M100 50 L92 75 L104 85 L94 105" stroke="#2D2A32" strokeWidth="4" fill="none" strokeLinecap="round" />}
        {cracks >= 2 && <path d="M60 130 L78 138 L70 150 L86 158" stroke="#2D2A32" strokeWidth="4" fill="none" strokeLinecap="round" />}
        {cracks >= 3 && <path d="M140 110 L126 122 L138 132 L124 142" stroke="#2D2A32" strokeWidth="4" fill="none" strokeLinecap="round" />}
        {cracks >= 4 && <path d="M110 180 L98 192 L112 202 L100 215" stroke="#2D2A32" strokeWidth="4" fill="none" strokeLinecap="round" />}
        {cracks >= 5 && <path d="M40 80 Q60 100 50 130" stroke="#2D2A32" strokeWidth="4" fill="none" strokeLinecap="round" />}
      </svg>
    </div>
  );
}

function ActionButton({ onClick, bg, emoji, label }: { onClick: () => void; bg: string; emoji: string; label: string }) {
  return (
    <button onClick={onClick} className={`btn-chunk ${bg} text-ink text-sm md:text-base`}>
      <span className="text-xl md:text-2xl">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function DecorBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
      <div className="absolute top-10 left-[8%] w-24 h-24 rounded-full bg-peach border-[3px] border-ink shadow-chunkSm animate-float opacity-80" />
      <div className="absolute top-1/3 right-[6%] w-16 h-16 rounded-3xl bg-mint border-[3px] border-ink shadow-chunkSm animate-float opacity-80" style={{ animationDelay: "1.2s" }} />
      <div className="absolute bottom-20 left-[14%] w-20 h-20 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-butter border-[3px] border-ink shadow-chunkSm animate-float opacity-80" style={{ animationDelay: "2.4s" }} />
      <div className="absolute bottom-32 right-[10%] w-14 h-14 rounded-full bg-lavender border-[3px] border-ink shadow-chunkSm animate-float opacity-80" style={{ animationDelay: "0.6s" }} />
      <svg className="absolute top-6 right-1/3 w-12 h-12 animate-spin opacity-70" viewBox="0 0 100 100">
        <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="#FF6B6B" stroke="#2D2A32" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
