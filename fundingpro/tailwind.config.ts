import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "funding-green": "#008A2E",
        "funding-accent": "#12B94F",
        "funding-dark": "#020703",
        "funding-dark-2": "#050A06",
        "funding-muted": "#A7B8AA",
        "funding-light-green": "#D9F7DD",
        "funding-light-bg": "#F7FAF7",
        "funding-black": "#050505",
        "funding-border": "#008A2E",
        "funding-card-light": "#D8F5DC",
        "funding-text-muted-light": "#4A5A4D",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
