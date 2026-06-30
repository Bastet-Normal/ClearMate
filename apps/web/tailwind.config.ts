import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // 暖翡翠绿品牌色（守护=安全=绿，生活化）
        brand: {
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        // 暖琥珀强调色
        accent: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        // 语义表面色（暖灰 stone 系，跟随 CSS 变量）
        surface: {
          0: "rgb(var(--bg-0) / <alpha-value>)",
          1: "rgb(var(--bg-1) / <alpha-value>)",
          2: "rgb(var(--bg-2) / <alpha-value>)",
          3: "rgb(var(--bg-3) / <alpha-value>)",
        },
        fg: {
          primary:   "rgb(var(--fg-primary) / <alpha-value>)",
          secondary: "rgb(var(--fg-secondary) / <alpha-value>)",
          muted:     "rgb(var(--fg-muted) / <alpha-value>)",
          faint:     "rgb(var(--fg-faint) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          strong:  "rgb(var(--border-strong) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      backgroundImage: {
        // 浅色温暖 Hero 渐变
        "hero-gradient": "linear-gradient(135deg, #f0fdfa 0%, #ecfeff 35%, #fff7ed 70%, #fef3c7 100%)",
        "brand-gradient": "linear-gradient(135deg, #0d9488, #14b8a6)",
        "brand-gradient-hover": "linear-gradient(135deg, #0f766e, #0d9488)",
        "risk-gradient": "linear-gradient(90deg, #10b981, #f59e0b, #f97316, #ef4444)",
      },
      boxShadow: {
        "glow-sm":   "0 0 15px -3px rgb(13 148 136 / 0.25)",
        "glow-md":   "0 0 25px -5px rgb(13 148 136 / 0.3)",
        "danger-glow": "0 0 20px -5px rgb(239 68 68 / 0.35)",
        "card":      "0 1px 3px 0 rgb(41 37 36 / 0.06), 0 1px 2px -1px rgb(41 37 36 / 0.06)",
        "card-hover":"0 10px 25px -5px rgb(41 37 36 / 0.1), 0 4px 8px -4px rgb(41 37 36 / 0.06)",
        "card-lg":   "0 20px 40px -10px rgb(41 37 36 / 0.12)",
        "soft":      "0 2px 8px -2px rgb(41 37 36 / 0.08)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      spacing: {
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
        "22": "5.5rem",
      },
      animation: {
        "fade-in":       "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-up":    "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-down":  "fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-right":"slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in":      "scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "float":         "float 5s ease-in-out infinite",
        "pulse-subtle":  "pulse-subtle 4s ease-in-out infinite",
        "pulse-ring":    "pulse-ring 2s ease-out infinite",
        "radar-ping":    "radar-ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        "spin-slow":     "spin-slow 3s linear infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        "shimmer":       "shimmer 2.5s ease-in-out infinite",
        "skeleton":      "skeleton-shimmer 1.5s ease-in-out infinite",
        "slide-up-fade": "slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "stagger-in":    "stagger-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "shake":         "shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
      },
      keyframes: {
        fadeIn:        { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeInUp:      { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeInDown:    { from: { opacity: "0", transform: "translateY(-16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideInRight:  { from: { opacity: "0", transform: "translateX(24px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        scaleIn:       { from: { opacity: "0", transform: "scale(0.92)" }, to: { opacity: "1", transform: "scale(1)" } },
        float:         { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
        "pulse-subtle":{ "0%, 100%": { opacity: "0.4", transform: "scale(1)" }, "50%": { opacity: "0.6", transform: "scale(1.05)" } },
        "pulse-ring":  { "0%": { transform: "scale(0.95)", opacity: "0.8" }, "100%": { transform: "scale(1.6)", opacity: "0" } },
        "radar-ping":  { "0%": { transform: "scale(1)", opacity: "1" }, "100%": { transform: "scale(2.2)", opacity: "0" } },
        "spin-slow":   { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        "bounce-subtle":{ "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-5px)" } },
        shimmer:       { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        "skeleton-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "slide-up-fade":{ from: { opacity: "0", transform: "translateY(8px) scale(0.97)" }, to: { opacity: "1", transform: "translateY(0) scale(1)" } },
        "stagger-in":  { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shake: {
          "10%, 90%": { transform: "translateX(-1px)" },
          "20%, 80%": { transform: "translateX(2px)" },
          "30%, 50%, 70%": { transform: "translateX(-4px)" },
          "40%, 60%": { transform: "translateX(4px)" },
        },
      },
      transitionTimingFunction: {
        "spring":  "cubic-bezier(0.16, 1, 0.3, 1)",
        "smooth":  "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce":  "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
