/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "dark-heading": "rgb(200 200 200);",
        "dark-main": "rgb(156 163 175)",
        "dark-container": "rgb(33, 33, 37)",
        "dark-back": "rgb(24, 24, 24)",
        "dark-border": "rgb(29, 33, 37)",
        "focus-border": "#3b82f666",
        "dark-form-back": "rgb(55 55 60)",
        "dark-form-border": "rgb(55 55 60)",
        "dark-button-back": "rgb(67 56 202)",
        "dark-button-hover": "rgb(79 70 229)",
        "dark-button-back-gray": "rgb(55 55 64)",
        "dark-button-gray-hover": "rgb(65 65 74)",
      },
      keyframes: {
        scaling: {
          "0%": { opacity: 0 },
          "20%": { transform: "scale(0.9, 0.9)" },
          "100%": { transform: "scale(1, 1)" },
        },
      },
    },
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  plugins: [],
};
