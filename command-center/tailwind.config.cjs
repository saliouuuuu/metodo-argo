/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0B0F",
        surface: "#17171C",
        line: "rgba(255,255,255,0.06)",
        ink: "#F5F5F7",
        ink2: "#98989D",
        viola: "#8B5CF6",
        "viola-h": "#A78BFA",
        "viola-p": "#6D28D9",
        pos: "#30D158",
        warn: "#FF9F0A",
        crit: "#FF453A",
      },
      fontFamily: { sans: ["Inter", "-apple-system", "system-ui", "sans-serif"] },
      borderRadius: { xl: "16px", "2xl": "20px" },
    },
  },
  plugins: [],
};
