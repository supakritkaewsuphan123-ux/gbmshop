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
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          glow: "rgba(59,130,246,0.3)",
          light: "rgba(59,130,246,0.05)",
        },
        secondary: {
          DEFAULT: "#60A5FA",
          light: "#DBEAFE",
        },
        background: "#F9FAFB",
        surface: "#FFFFFF",
        border: "#E5E7EB",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.05)",
        "soft-card": "0 8px 30px rgba(0,0,0,0.04)",
        "glow": "0 0 15px rgba(59,130,246,0.3)",
        "glow-sm": "0 0 10px rgba(59,130,246,0.2)",
        "glow-lg": "0 0 25px rgba(59,130,246,0.4)",
        card: "0 10px 40px rgba(0,0,0,0.03)",
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
