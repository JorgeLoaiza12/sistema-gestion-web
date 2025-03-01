// lib/themes.ts
export const themes = {
  default: {
    primary: {
      DEFAULT: "#6366F1", // Indigo-500
      foreground: "#FFFFFF",
      hover: "#4F46E5", // Indigo-600
      focus: "#4338CA", // Indigo-700
    },
    secondary: {
      DEFAULT: "#F3F4F6", // Gray-100
      foreground: "#374151", // Gray-700
      hover: "#E5E7EB", // Gray-200
      focus: "#D1D5DB", // Gray-300
    },
    background: {
      DEFAULT: "#FFFFFF",
      secondary: "#F9FAFB", // Gray-50
    },
    border: {
      DEFAULT: "#E5E7EB", // Gray-200
      focus: "#6366F1", // Indigo-500
    },
    ring: {
      DEFAULT: "#E5E7EB", // Gray-200
      focus: "#6366F1", // Indigo-500
    },
    content: {
      subtle: "#6B7280", // Gray-500
      DEFAULT: "#374151", // Gray-700
      emphasis: "#111827", // Gray-900
    },
    error: {
      DEFAULT: "#EF4444", // Red-500
      foreground: "#FFFFFF",
    },
    success: {
      DEFAULT: "#22C55E", // Green-500
      foreground: "#FFFFFF",
    },
  },
  dark: {
    // Tema oscuro que se puede personalizar...
  },
};

export type Theme = typeof themes.default;
