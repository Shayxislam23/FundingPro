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
        "funding-green": "#428238",
        "funding-accent": "#4f9a45",
        "funding-dark": "#020703",
        "funding-dark-2": "#050A06",
        "funding-muted": "#A7B8AA",
        "funding-light-green": "#e8f0e6",
        "funding-light-bg": "#F7FAF7",
        "funding-black": "#050505",
        "funding-border": "#428238",
        "funding-card-light": "#dce8da",
        "funding-text-muted-light": "#4A5A4D",
        "zoomrad-green": "#008A2E",
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
