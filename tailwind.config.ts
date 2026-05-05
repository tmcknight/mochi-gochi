import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF5E4",
        peach: "#FFB5A7",
        peachDeep: "#FF8A75",
        mint: "#B7E4C7",
        mintDeep: "#7FCBA0",
        butter: "#FFE066",
        coral: "#FF6B6B",
        ink: "#2D2A32",
        lavender: "#D4C5F9",
      },
      fontFamily: {
        display: ['"Gluten"', "cursive"],
        body: ['"Nunito"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        chunk: "6px 6px 0 0 #2D2A32",
        chunkSm: "3px 3px 0 0 #2D2A32",
        chunkLg: "10px 10px 0 0 #2D2A32",
        chunkPress: "2px 2px 0 0 #2D2A32",
      },
      animation: {
        breathe: "breathe 3.5s ease-in-out infinite",
        bob: "bob 2.8s ease-in-out infinite",
        blink: "blink 4.2s ease-in-out infinite",
        wiggle: "wiggle 0.4s ease-in-out",
        float: "float 6s ease-in-out infinite",
        pop: "pop 0.5s cubic-bezier(.18,.89,.32,1.28)",
        spin: "spin 12s linear infinite",
      },
      keyframes: {
        breathe: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        bob: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        blink: {
          "0%,92%,100%": { transform: "scaleY(1)" },
          "94%,98%": { transform: "scaleY(0.1)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(0)" },
          "25%": { transform: "rotate(-8deg)" },
          "75%": { transform: "rotate(8deg)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(6deg)" },
        },
        pop: {
          "0%": { transform: "scale(0) rotate(-30deg)", opacity: "0" },
          "60%": { transform: "scale(1.2) rotate(10deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
