import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7ccbfc",
          400: "#36b2f8",
          500: "#0c98e7",
          600: "#0078c5",
          700: "#0160a1",
          800: "#065184",
          900: "#0b446d",
          950: "#072b49",
        },
        risk: {
          low: "#22c55e",
          medium: "#f59e0b",
          high: "#ef4444",
          critical: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};

export default config;
