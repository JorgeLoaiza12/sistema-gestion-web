// tailwind.config.ts
import { themes } from "./lib/themes";

import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: themes.default.primary.DEFAULT,
          foreground: themes.default.primary.foreground,
          hover: themes.default.primary.hover,
          focus: themes.default.primary.focus,
        },
        secondary: {
          DEFAULT: themes.default.secondary.DEFAULT,
          foreground: themes.default.secondary.foreground,
          hover: themes.default.secondary.hover,
          focus: themes.default.secondary.focus,
        },
        background: {
          DEFAULT: themes.default.background.DEFAULT,
          secondary: themes.default.background.secondary,
        },
        border: {
          DEFAULT: themes.default.border.DEFAULT,
          focus: themes.default.border.focus,
        },
        ring: {
          DEFAULT: themes.default.ring.DEFAULT,
          focus: themes.default.ring.focus,
        },
        content: {
          subtle: themes.default.content.subtle,
          DEFAULT: themes.default.content.DEFAULT,
          emphasis: themes.default.content.emphasis,
        },
        error: {
          DEFAULT: themes.default.error.DEFAULT,
          foreground: themes.default.error.foreground,
        },
        success: {
          DEFAULT: themes.default.success.DEFAULT,
          foreground: themes.default.success.foreground,
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
