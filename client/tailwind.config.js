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
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          glow: "rgba(37,99,235,0.3)",
          light: "rgba(37,99,235,0.05)",
        },
        secondary: {
          DEFAULT: "#60A5FA",
          light: "#EFF6FF",
        },
        background: "#FFFFFF",
        surface: "#FFFFFF",
        border: "#F1F5F9",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.03)",
        "soft-card": "0 8px 30px rgba(37,99,235,0.04)",
        "glow": "0 0 15px rgba(37,99,235,0.2)",
        "glow-sm": "0 0 10px rgba(37,99,235,0.1)",
        "glow-lg": "0 0 25px rgba(37,99,235,0.3)",
        card: "0 10px 40px rgba(0,0,0,0.02)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
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
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
