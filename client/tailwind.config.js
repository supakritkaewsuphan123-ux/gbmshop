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
          DEFAULT: "#EE4D2D",
          hover: "#D63D1F",
          glow: "rgba(238,77,45,0.4)",
          light: "rgba(238,77,45,0.1)",
        },
        brand: {
          dark: "#050B18",
          darker: "#020617",
          navy: "#0A192F",
        },
        secondary: {
          DEFAULT: "#FB923C",
          light: "#DBEAFE",
        },
        background: "#050B18",
        surface: "#0A192F",
        border: "rgba(238,77,45,0.1)",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.4)",
        "soft-card": "0 8px 30px rgba(0,0,0,0.5)",
        "glow": "0 0 15px rgba(238,77,45,0.3)",
        "glow-sm": "0 0 10px rgba(238,77,45,0.2)",
        "glow-lg": "0 0 25px rgba(238,77,45,0.5)",
        card: "0 10px 40px rgba(0,0,0,0.3)",
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
