/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#09090b", // zinc-950
        card: "#18181b",   // zinc-900
        cardBorder: "#27272a", // zinc-800
      },
      fontFamily: {
        mono: ["GeistMono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        pixel: ["GeistPixel", "Press Start 2P", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
