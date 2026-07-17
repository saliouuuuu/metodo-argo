/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#05080D",
        bg2: "#080C12",
        card: "#0C1119",
        card2: "#0A0F16",
        hair: "rgba(120,190,255,0.12)",
        hair2: "rgba(120,190,255,0.06)",
        fg: "#F5F8FC",
        muted: "#8B97A8",
        faint: "#5A6675",
        cyan: "#26E6FF",
        blue: "#3388FF",
        green: "#41F5A2",
        violet: "#9D6CFF",
        red: "#FF5E6C",
        yellow: "#FFC857",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: { xl: "14px", "2xl": "18px" },
      boxShadow: {
        card: "inset 0 1px 0 0 rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.4)",
        glow: "0 0 40px -8px rgba(38,230,255,0.35)",
      },
    },
  },
  plugins: [],
};
