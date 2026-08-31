/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blueprint: {
          bg: "#f1f5f9",
          grid: "#cbd5e1",
          wall: "#334155",
          room: "#ffffff",
          selected: "#2563eb",
          snap: "#16a34a",
          socket: "#eab308",
          internet: "#06b6d4"
        }
      }
    },
  },
  plugins: [],
};
