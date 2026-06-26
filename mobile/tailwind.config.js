/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        funding: {
          green: "#008A2E",
          accent: "#12B94F",
          black: "#050505",
          dark: "#020703",
          "dark-2": "#050A06",
          muted: "#A7B8AA",
          "light-green": "#D9F7DD",
          "light-bg": "#F7FAF7",
          light: "#F9FAFB",
          border: "#008A2E",
          "card-light": "#D8F5DC",
          "text-muted-light": "#4A5A4D",
        },
      },
      fontSize: {
        display: ["2rem", { lineHeight: "2.375rem", fontWeight: "800" }],
        title: ["1.5rem", { lineHeight: "1.875rem", fontWeight: "700" }],
        headline: ["1.125rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }],
        overline: ["0.625rem", { lineHeight: "0.875rem", fontWeight: "600", letterSpacing: "0.08em" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
        elevated: "0 4px 12px 0 rgb(0 0 0 / 0.1)",
        button: "0 2px 8px 0 rgb(0 138 46 / 0.25)",
      },
    },
  },
  plugins: [],
};
