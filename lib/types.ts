export type Mood = "ecstatic" | "happy" | "neutral" | "sad" | "sleepy" | "hungry" | "sick" | "queasy";

export type MochiShape = "blob" | "round" | "tall" | "puff" | "lump";
export type MochiEars = "nubs" | "long" | "antennae" | "horns" | "none";

export type MochiVariant = {
  shape: MochiShape;
  bodyColor: string;
  ears: MochiEars;
};

export type PetState = {
  happiness: number;
  hunger: number;
  energy: number;
  cleanliness: number;
  motionSickness: number;
  sick: boolean;
  age: number;
  asleep: boolean;
  hatched: boolean;
  variant?: MochiVariant;
  lastTick: number;
};
