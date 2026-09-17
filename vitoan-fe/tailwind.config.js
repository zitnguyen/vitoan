/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00b14f",
          dark: "#049245",
          light: "#7fe3a8",
        },
        secondary: {
          DEFAULT: "#0091ff",
          dark: "#0072cc",
        },
        math: "#0091ff",
        vietnamese: "#ff8a00",
        navy: "#0b2340",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Baloo 2", "system-ui", "sans-serif"],
      },
      // Elevation scale modeled on Material Design's dp-based shadow levels:
      // each step layers a tight "key light" shadow with a softer "ambient" shadow.
      boxShadow: {
        "elevation-1": "0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.06)",
        "elevation-2": "0 2px 4px rgb(15 23 42 / 0.05), 0 8px 16px -4px rgb(15 23 42 / 0.10)",
        "elevation-3": "0 4px 8px rgb(15 23 42 / 0.06), 0 16px 32px -8px rgb(15 23 42 / 0.14)",
        "elevation-4": "0 8px 16px rgb(15 23 42 / 0.08), 0 24px 48px -12px rgb(15 23 42 / 0.18)",
      },
      // Typographic scale (1.25 "major third" ratio) for consistent heading/body sizing.
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1.4" }],
        body: ["0.9375rem", { lineHeight: "1.6" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        h3: ["1.375rem", { lineHeight: "1.35", fontWeight: "700" }],
        h2: ["1.75rem", { lineHeight: "1.3", fontWeight: "800" }],
        h1: ["2.75rem", { lineHeight: "1.15", fontWeight: "800" }],
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};
