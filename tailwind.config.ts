import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F3EE",
        surface: "#FFFFFF",
        ink: "#1B1D1F",
        muted: "#6B7280",
        line: "#E4E0D6",
        brand: {
          DEFAULT: "#1F3A5F",
          light: "#2E5482",
          dark: "#14273E",
        },
        rust: {
          DEFAULT: "#C97A2B",
          light: "#E0973F",
        },
        stockin: {
          DEFAULT: "#2F7D4F",
          bg: "#E9F4EC",
        },
        stockout: {
          DEFAULT: "#B4432E",
          bg: "#FBEBE6",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,29,31,0.06), 0 1px 8px rgba(27,29,31,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
