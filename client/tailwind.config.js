/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        prompt: ["'Prompt'", "sans-serif"],
        inter: ["'Inter'", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#ff003c",
          hover: "#ff3366",
          glow: "rgba(255,0,60,0.6)",
          light: "rgba(255,0,60,0.1)",
        },
        surface: {
          DEFAULT: "#141419",
          hover: "#1e1e26",
        },
        bg: "#0a0a0c",
        border: "rgba(255,255,255,0.1)",
      },
      boxShadow: {
        glow: "0 0 15px rgba(255,0,60,0.6)",
        "glow-sm": "0 0 8px rgba(255,0,60,0.4)",
        card: "0 8px 30px rgba(0,0,0,0.5)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "slide-right": "slideRight 0.3s ease forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        slideRight: {
          from: { opacity: 0, transform: "translateX(100%)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(255,0,60,0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(255,0,60,0.8)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
