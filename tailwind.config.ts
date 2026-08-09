import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#F5A623",
          50:  "#FEF9EE",
          100: "#FDF0D0",
          200: "#FBE0A0",
          300: "#F8C965",
          400: "#F5A623",
          500: "#E8920A",
          600: "#C47307",
          700: "#9A5605",
          800: "#7A4204",
          900: "#5C3103",
        },
        charcoal: {
          950: "#080808",
          900: "#111111",
          800: "#1A1A1A",
          700: "#242424",
          600: "#2E2E2E",
          500: "#333333",
          400: "#444444",
        },
        win:      "#22C55E",
        loss:     "#EF4444",
        be:       "#F59E0B",
        "day-win":  "#D6F5E3",
        "day-loss": "#FAD7D7",
        "day-be":   "#FFF3CD",
      },
      fontFamily: {
        mono: ["Fira Code", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Fira Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-gold": "0 0 12px rgba(245, 166, 35, 0.35)",
        "glow-win":  "0 0 10px rgba(34, 197, 94, 0.25)",
        "glow-loss": "0 0 10px rgba(239, 68, 68, 0.25)",
      },
      animation: {
        "fade-in":  "fadeIn 150ms ease-in-out",
        "slide-in": "slideIn 200ms ease-out",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideIn: { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
