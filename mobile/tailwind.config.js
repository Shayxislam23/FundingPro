/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        funding: {
          green: "#008A2E",
          black: "#111827",
          light: "#F9FAFB",
        },
      },
    },
  },
  plugins: [],
};
