"use client";

import { useEffect, useState, useCallback } from "react";
import type { Mood, MochiEars, MochiShape, MochiVariant, PetState } from "./types";

const PALETTE = [
  "#FFB5A7", "#FF8A75", "#FFCAD4", "#F4C5B0", "#FFD6A5",
  "#FFE066", "#B5EAD7", "#7FCBA0", "#A8E6CF", "#C7CEEA",
  "#D4C5F9", "#B5B9FF", "#FFC8DD", "#FCBAD3", "#AEC6FF",
  "#FFD1B5", "#E0BBE4", "#FFABAB",
];
const SHAPES: MochiShape[] = ["blob", "round", "tall", "puff", "lump"];
const EARS: MochiEars[] = ["nubs", "long", "antennae", "horns", "none"];

const randomVariant = (): MochiVariant => ({
  shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
  bodyColor: PALETTE[Math.floor(Math.random() * PALETTE.length)],
  ears: EARS[Math.floor(Math.random() * EARS.length)],
});

const STORAGE_KEY = "mochi-gochi-v1";
const LEGACY_STORAGE_KEY = "mochi-pet-v2";

const initial: PetState = {
  happiness: 80,
  hunger: 70,
  energy: 75,
  cleanliness: 85,
  motionSickness: 0,
  sick: false,
  age: 0,
  asleep: false,
  hatched: false,
  lastTick: Date.now(),
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export type PukeEvent = { id: number; at: number };

export function usePet() {
  const [state, setState] = useState<PetState>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [pukeEvent, setPukeEvent] = useState<PukeEvent | null>(null);

  // hydrate
  useEffect(() => {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          raw = legacy;
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw) as PetState;
        const elapsedMin = (Date.now() - parsed.lastTick) / 60000;
        const decayed: PetState = {
          ...parsed,
          hatched: parsed.hatched ?? true, // existing saves keep their pet
          variant: parsed.variant ?? (parsed.hatched === false ? undefined : randomVariant()),
          hunger: clamp(parsed.hunger - elapsedMin * 0.8),
          happiness: clamp(parsed.happiness - elapsedMin * 0.6),
          energy: clamp(parsed.energy + (parsed.asleep ? elapsedMin * 1.5 : -elapsedMin * 0.4)),
          cleanliness: clamp(parsed.cleanliness - elapsedMin * 0.3),
          motionSickness: clamp((parsed.motionSickness ?? 0) - elapsedMin * 8),
          sick: parsed.sick && elapsedMin < 5,
          age: parsed.age + elapsedMin / 60,
          lastTick: Date.now(),
        };
        setState(decayed);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // persist
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  // tick loop
  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => {
        if (!s.hatched) return s; // egg doesn't decay
        const sleeping = s.asleep;
        const sickPenalty = s.sick ? 0.5 : 0;
        return {
          ...s,
          hunger: clamp(s.hunger - 0.4 - sickPenalty),
          happiness: clamp(s.happiness - (sleeping ? 0.05 : 0.3) - sickPenalty),
          energy: clamp(s.energy + (sleeping ? 1.6 : -0.25) - (s.sick ? 0.3 : 0)),
          cleanliness: clamp(s.cleanliness - 0.15),
          motionSickness: clamp(s.motionSickness - (sleeping ? 6 : 2.5)),
          sick: s.sick && !(sleeping && s.energy >= 80) && s.cleanliness < 95 ? s.sick : false,
          age: s.age + 0.0008,
          asleep: sleeping && s.energy >= 99 ? false : sleeping,
          lastTick: Date.now(),
        };
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const triggerPuke = useCallback(() => {
    setState((s) => ({
      ...s,
      happiness: clamp(s.happiness - 25),
      hunger: clamp(s.hunger - 20),
      cleanliness: clamp(s.cleanliness - 35),
      motionSickness: 0,
      sick: true,
      asleep: false,
    }));
    setPukeEvent({ id: Date.now(), at: Date.now() });
  }, []);

  const pet = useCallback(() => {
    setState((s) => ({ ...s, happiness: clamp(s.happiness + 4), asleep: false }));
  }, []);

  const feed = useCallback(() => {
    setState((s) => {
      // feeding while very queasy makes it worse
      if (s.motionSickness > 70 || s.sick) {
        return {
          ...s,
          motionSickness: clamp(s.motionSickness + 15),
          happiness: clamp(s.happiness - 4),
          asleep: false,
        };
      }
      return {
        ...s,
        hunger: clamp(s.hunger + 28),
        happiness: clamp(s.happiness + 6),
        asleep: false,
      };
    });
  }, []);

  const shake = useCallback(
    (intensity = 1) => {
      let didPuke = false;
      setState((s) => {
        const newSickness = clamp(s.motionSickness + 8 * intensity);
        // already sick + more shake = vomit again
        if (s.sick && intensity >= 1.5) {
          didPuke = true;
          return {
            ...s,
            happiness: clamp(s.happiness - 15),
            cleanliness: clamp(s.cleanliness - 20),
            motionSickness: 0,
            asleep: false,
          };
        }
        if (newSickness >= 100) {
          didPuke = true;
          return {
            ...s,
            happiness: clamp(s.happiness - 25),
            hunger: clamp(s.hunger - 20),
            cleanliness: clamp(s.cleanliness - 35),
            motionSickness: 0,
            sick: true,
            asleep: false,
          };
        }
        // normal shake — happiness gain scales DOWN as sickness rises
        const joyMultiplier = Math.max(0, 1 - newSickness / 100);
        return {
          ...s,
          happiness: clamp(s.happiness + 1.6 * intensity * joyMultiplier - (newSickness > 70 ? 1 : 0)),
          energy: clamp(s.energy - 0.4 * intensity),
          motionSickness: newSickness,
          asleep: false,
        };
      });
      if (didPuke) setPukeEvent({ id: Date.now(), at: Date.now() });
    },
    []
  );

  const clean = useCallback(() => {
    setState((s) => ({
      ...s,
      cleanliness: clamp(s.cleanliness + 35),
      happiness: clamp(s.happiness + 2),
      motionSickness: clamp(s.motionSickness - 20),
      sick: s.cleanliness + 35 >= 95 ? false : s.sick,
    }));
  }, []);

  const medicate = useCallback(() => {
    setState((s) => ({
      ...s,
      sick: false,
      motionSickness: 0,
      happiness: clamp(s.happiness + 8),
      cleanliness: clamp(s.cleanliness + 10),
    }));
  }, []);

  const toggleSleep = useCallback(() => {
    setState((s) => ({ ...s, asleep: !s.asleep }));
  }, []);

  const reset = useCallback(() => {
    setState({ ...initial, lastTick: Date.now() });
    setPukeEvent(null);
  }, []);

  const consumePuke = useCallback(() => setPukeEvent(null), []);

  const hatch = useCallback(() => {
    setState((s) =>
      s.hatched
        ? s
        : { ...s, hatched: true, happiness: 95, variant: s.variant ?? randomVariant(), lastTick: Date.now() }
    );
  }, []);

  const mood: Mood = (() => {
    if (state.asleep) return "sleepy";
    if (state.sick) return "sick";
    if (state.motionSickness > 65) return "queasy";
    if (state.hunger < 25) return "hungry";
    if (state.happiness > 88) return "ecstatic";
    if (state.happiness > 60) return "happy";
    if (state.happiness < 30) return "sad";
    return "neutral";
  })();

  return {
    state,
    mood,
    hydrated,
    pet,
    feed,
    shake,
    clean,
    medicate,
    toggleSleep,
    reset,
    triggerPuke,
    pukeEvent,
    consumePuke,
    hatch,
  };
}
