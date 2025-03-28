// lib/themes.ts
export const themes = {
  default: {
    primary: {
      DEFAULT: "#b42516", // Color principal rojo
      foreground: "#FFFFFF", // Texto blanco
      hover: "#9e2113", // Un tono más oscuro para hover
      focus: "#8a1d10", // Un tono aún más oscuro para focus
    },
    secondary: {
      DEFAULT: "#F3F4F6", // Gris claro
      foreground: "#374151", // Gris oscuro
      hover: "#E5E7EB", // Gris más claro para hover
      focus: "#D1D5DB", // Gris aún más claro para focus
    },
    background: {
      DEFAULT: "#FFFFFF", // Fondo blanco
      secondary: "#F9FAFB", // Gris muy claro
    },
    border: {
      DEFAULT: "#E5E7EB", // Borde gris claro
      focus: "#b42516", // Borde rojo al enfocar
    },
    ring: {
      DEFAULT: "#E5E7EB", // Anillo gris claro
      focus: "#b42516", // Anillo rojo al enfocar
    },
    content: {
      subtle: "#6B7280", // Texto gris
      DEFAULT: "#1F2937", // Texto casi negro
      emphasis: "#111827", // Texto negro
    },
    accent: {
      DEFAULT: "#f8d7d4", // Un tono claro de rojo como acento
      hover: "#f5c5c1", // Un tono más oscuro para hover
    },
    error: {
      DEFAULT: "#EF4444", // Rojo para errores
      foreground: "#FFFFFF", // Texto blanco
    },
    success: {
      DEFAULT: "#22C55E", // Verde para éxito
      foreground: "#FFFFFF", // Texto blanco
    },
  },
  // dark: {
  //   primary: {
  //     DEFAULT: "#b42516", // Mantener el rojo en modo oscuro
  //     foreground: "#FFFFFF", // Texto blanco
  //     hover: "#9e2113", // Un tono más oscuro para hover
  //     focus: "#8a1d10", // Un tono aún más oscuro para focus
  //   },
  //   secondary: {
  //     DEFAULT: "#374151", // Gris oscuro
  //     foreground: "#F9FAFB", // Texto claro
  //     hover: "#4B5563", // Gris un poco más claro para hover
  //     focus: "#6B7280", // Gris aún más claro para focus
  //   },
  //   background: {
  //     DEFAULT: "#111827", // Fondo negro
  //     secondary: "#1F2937", // Gris muy oscuro
  //   },
  //   border: {
  //     DEFAULT: "#374151", // Borde gris oscuro
  //     focus: "#b42516", // Borde rojo al enfocar
  //   },
  //   ring: {
  //     DEFAULT: "#374151", // Anillo gris oscuro
  //     focus: "#b42516", // Anillo rojo al enfocar
  //   },
  //   content: {
  //     subtle: "#9CA3AF", // Texto gris claro
  //     DEFAULT: "#E5E7EB", // Texto casi blanco
  //     emphasis: "#FFFFFF", // Texto blanco
  //   },
  //   accent: {
  //     DEFAULT: "#7f1a0f", // Un tono oscuro de rojo como acento
  //     hover: "#6a160c", // Un tono más oscuro para hover
  //   },
  //   error: {
  //     DEFAULT: "#F87171", // Rojo más claro para errores en modo oscuro
  //     foreground: "#FFFFFF", // Texto blanco
  //   },
  //   success: {
  //     DEFAULT: "#4ADE80", // Verde más claro para éxito en modo oscuro
  //     foreground: "#FFFFFF", // Texto blanco
  //   },
  // },
};

export type Theme = typeof themes.default;
