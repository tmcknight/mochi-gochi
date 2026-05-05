"use client";

import type { MochiEars, MochiShape, Mood } from "@/lib/types";

type Props = {
  mood: Mood;
  color: string;
  cheekColor: string;
  blushIntensity: number;
  shape?: MochiShape;
  ears?: MochiEars;
};

const BODY_PATHS: Record<MochiShape, string> = {
  blob: "M160 50 C 230 50, 280 100, 280 170 C 280 240, 225 280, 160 280 C 95 280, 40 240, 40 170 C 40 100, 90 50, 160 50 Z",
  round: "M160 55 C 235 55, 275 115, 275 170 C 275 230, 230 275, 160 275 C 90 275, 45 230, 45 170 C 45 115, 85 55, 160 55 Z",
  tall: "M160 35 C 220 35, 255 90, 255 165 C 255 245, 220 285, 160 285 C 100 285, 65 245, 65 165 C 65 90, 100 35, 160 35 Z",
  puff: "M160 60 C 245 50, 290 110, 280 175 C 290 245, 215 285, 160 275 C 105 285, 30 245, 40 175 C 30 110, 75 50, 160 60 Z",
  lump: "M160 65 C 240 45, 275 130, 270 180 C 285 240, 210 285, 158 270 C 110 285, 35 245, 50 180 C 40 120, 90 45, 160 65 Z",
};

export default function Mochi({ mood, color, cheekColor, blushIntensity, shape = "blob", ears = "nubs" }: Props) {
  const bodyD = BODY_PATHS[shape];

  const eyeShape = (() => {
    switch (mood) {
      case "ecstatic":
      case "happy":
        return "happy";
      case "neutral":
        return "open";
      case "sad":
        return "sad";
      case "sleepy":
        return "closed";
      case "hungry":
        return "open";
      case "queasy":
        return "swirl";
      case "sick":
        return "swirl";
    }
  })();

  const mouth = (() => {
    switch (mood) {
      case "ecstatic":
        return "bigSmile";
      case "happy":
        return "smile";
      case "neutral":
        return "neutral";
      case "sad":
        return "frown";
      case "sleepy":
        return "snooze";
      case "hungry":
        return "wobble";
      case "queasy":
        return "wavy";
      case "sick":
        return "ohno";
    }
  })();

  return (
    <svg
      viewBox="0 0 320 320"
      className="w-full h-full select-none drop-shadow-[10px_10px_0_rgba(45,42,50,1)]"
      aria-label="Mochi the blob"
    >
      <defs>
        <radialGradient id="bodyGrad" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="55%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* shadow puddle */}
      <ellipse cx="160" cy="285" rx="92" ry="11" fill="#2D2A32" opacity="0.18" />

      {/* body */}
      <g className="animate-breathe origin-center" style={{ transformOrigin: "160px 170px" }}>
        <Ears kind={ears} color={color} />

        <path d={bodyD} fill={color} stroke="#2D2A32" strokeWidth="6" strokeLinejoin="round" />
        <path d={bodyD} fill="url(#bodyGrad)" />

        {/* cheeks */}
        <ellipse cx="100" cy="190" rx="22" ry="14" fill={cheekColor} opacity={0.45 + blushIntensity * 0.5} />
        <ellipse cx="220" cy="190" rx="22" ry="14" fill={cheekColor} opacity={0.45 + blushIntensity * 0.5} />

        {/* eyes */}
        <Eye x={120} y={160} shape={eyeShape} />
        <Eye x={200} y={160} shape={eyeShape} />

        {/* mouth */}
        <Mouth shape={mouth} />

        {/* sleepy z */}
        {mood === "sleepy" && (
          <>
            <text x="240" y="80" className="zzz font-display" fill="#2D2A32" fontSize="28" fontWeight="900">z</text>
            <text x="260" y="60" className="zzz font-display" fill="#2D2A32" fontSize="22" fontWeight="900" style={{ animationDelay: "0.6s" }}>z</text>
          </>
        )}

        {/* hunger droplet */}
        {mood === "hungry" && (
          <path d="M75 105 Q70 115, 75 122 Q80 115, 75 105 Z" fill="#7FCBA0" stroke="#2D2A32" strokeWidth="2" />
        )}

        {/* queasy / sick green tint */}
        {(mood === "queasy" || mood === "sick") && (
          <g>
            <path d={bodyD} fill="#9FD9A8" opacity={mood === "sick" ? 0.45 : 0.25} />
            <path d="M75 95 Q68 110, 75 120 Q82 110, 75 95 Z" fill="#7FCBA0" stroke="#2D2A32" strokeWidth="2" />
            <path d="M250 110 Q243 125, 250 135 Q257 125, 250 110 Z" fill="#7FCBA0" stroke="#2D2A32" strokeWidth="2" />
          </g>
        )}

        {mood === "sick" && (
          <ellipse cx="160" cy="232" rx="6" ry="9" fill="#FF8A75" stroke="#2D2A32" strokeWidth="2.5" />
        )}
      </g>
    </svg>
  );
}

function Ears({ kind, color }: { kind: MochiEars; color: string }) {
  if (kind === "none") return null;
  if (kind === "nubs") {
    return (
      <>
        <ellipse cx="100" cy="62" rx="14" ry="18" fill={color} stroke="#2D2A32" strokeWidth="5" transform="rotate(-22 100 62)" />
        <ellipse cx="220" cy="62" rx="14" ry="18" fill={color} stroke="#2D2A32" strokeWidth="5" transform="rotate(22 220 62)" />
      </>
    );
  }
  if (kind === "long") {
    return (
      <>
        <ellipse cx="95" cy="40" rx="12" ry="35" fill={color} stroke="#2D2A32" strokeWidth="5" transform="rotate(-18 95 40)" />
        <ellipse cx="225" cy="40" rx="12" ry="35" fill={color} stroke="#2D2A32" strokeWidth="5" transform="rotate(18 225 40)" />
        <ellipse cx="92" cy="42" rx="5" ry="20" fill="#FFB5C5" opacity="0.7" transform="rotate(-18 92 42)" />
        <ellipse cx="228" cy="42" rx="5" ry="20" fill="#FFB5C5" opacity="0.7" transform="rotate(18 228 42)" />
      </>
    );
  }
  if (kind === "antennae") {
    return (
      <>
        <path d="M110 60 Q 95 25, 90 10" stroke="#2D2A32" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M210 60 Q 225 25, 230 10" stroke="#2D2A32" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="90" cy="10" r="9" fill="#FFE066" stroke="#2D2A32" strokeWidth="4" />
        <circle cx="230" cy="10" r="9" fill="#FF6B6B" stroke="#2D2A32" strokeWidth="4" />
      </>
    );
  }
  if (kind === "horns") {
    return (
      <>
        <path d="M105 55 L 90 20 L 118 45 Z" fill={color} stroke="#2D2A32" strokeWidth="5" strokeLinejoin="round" />
        <path d="M215 55 L 230 20 L 202 45 Z" fill={color} stroke="#2D2A32" strokeWidth="5" strokeLinejoin="round" />
      </>
    );
  }
  return null;
}

function Eye({ x, y, shape }: { x: number; y: number; shape: string }) {
  if (shape === "closed") {
    return <path d={`M ${x - 10} ${y} Q ${x} ${y + 8}, ${x + 10} ${y}`} stroke="#2D2A32" strokeWidth="5" strokeLinecap="round" fill="none" />;
  }
  if (shape === "happy") {
    return <path d={`M ${x - 11} ${y + 4} Q ${x} ${y - 10}, ${x + 11} ${y + 4}`} stroke="#2D2A32" strokeWidth="5" strokeLinecap="round" fill="none" />;
  }
  if (shape === "sad") {
    return (
      <g>
        <ellipse cx={x} cy={y} rx="6" ry="7" fill="#2D2A32" />
        <circle cx={x - 2} cy={y - 2} r="2" fill="white" />
      </g>
    );
  }
  if (shape === "swirl") {
    return (
      <g style={{ transformOrigin: `${x}px ${y}px` }} className="animate-spin">
        <path
          d={`M ${x} ${y - 9} a 9 9 0 1 1 -0.01 0 m 0 4 a 5 5 0 1 0 0.01 0 m 0 3 a 2 2 0 1 1 0.01 0`}
          stroke="#2D2A32"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }
  return (
    <g className="origin-center" style={{ transformOrigin: `${x}px ${y}px` }}>
      <ellipse cx={x} cy={y} rx="7" ry="9" fill="#2D2A32" className="animate-blink origin-center" style={{ transformOrigin: `${x}px ${y}px` }} />
      <circle cx={x - 2} cy={y - 3} r="2.5" fill="white" />
    </g>
  );
}

function Mouth({ shape }: { shape: string }) {
  switch (shape) {
    case "bigSmile":
      return (
        <path
          d="M 130 215 Q 160 250, 190 215 Q 175 232, 160 232 Q 145 232, 130 215 Z"
          fill="#FF6B6B"
          stroke="#2D2A32"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      );
    case "smile":
      return <path d="M 135 215 Q 160 235, 185 215" stroke="#2D2A32" strokeWidth="5" strokeLinecap="round" fill="none" />;
    case "neutral":
      return <path d="M 145 220 L 175 220" stroke="#2D2A32" strokeWidth="5" strokeLinecap="round" />;
    case "frown":
      return <path d="M 135 228 Q 160 210, 185 228" stroke="#2D2A32" strokeWidth="5" strokeLinecap="round" fill="none" />;
    case "snooze":
      return <path d="M 145 220 Q 160 226, 175 220" stroke="#2D2A32" strokeWidth="5" strokeLinecap="round" fill="none" />;
    case "wobble":
      return <path d="M 138 220 Q 148 214, 158 220 Q 168 226, 178 220" stroke="#2D2A32" strokeWidth="5" strokeLinecap="round" fill="none" />;
    case "wavy":
      return <path d="M 132 222 Q 142 214, 152 222 T 172 222 T 188 222" stroke="#2D2A32" strokeWidth="5" strokeLinecap="round" fill="none" />;
    case "ohno":
      return (
        <g>
          <ellipse cx="160" cy="225" rx="13" ry="10" fill="#2D2A32" />
          <ellipse cx="160" cy="223" rx="9" ry="6" fill="#FF6B6B" />
        </g>
      );
    default:
      return null;
  }
}
