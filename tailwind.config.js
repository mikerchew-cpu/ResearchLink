// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ResearchLink brand palette
        teal: {
          50:  "#E1F5EE",
          100: "#9FE1CB",
          200: "#5DCAA5",
          400: "#1D9E75",   // primary brand
          600: "#0F6E56",   // hover
          800: "#085041",   // dark
          900: "#04342C",
        },
        purple: {
          50:  "#EEEDFE",
          100: "#CECBF6",
          200: "#AFA9EC",
          400: "#7F77DD",
          600: "#534AB7",
          800: "#3C3489",
          900: "#26215C",
        },
        coral: {
          50:  "#FAECE7",
          100: "#F5C4B3",
          400: "#D85A30",
          600: "#993C1D",
          800: "#712B13",
        },
        amber: {
          50:  "#FAEEDA",
          100: "#FAC775",
          400: "#BA7517",
          600: "#854F0B",
          800: "#633806",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg:      "12px",
        xl:      "16px",
        "2xl":   "20px",
      },
      boxShadow: {
        // Very subtle — no heavy drop shadows per design system
        sm:   "0 1px 4px rgba(0,0,0,0.06)",
        DEFAULT: "0 2px 8px rgba(0,0,0,0.08)",
      },
      keyframes: {
        slideIn: { from: { transform: "translateX(20px)", opacity: "0" }, to: { transform: "translateX(0)", opacity: "1" } },
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        spin:    { to: { transform: "rotate(360deg)" } },
        bounce:  { "0%,80%,100%": { transform: "translateY(0)" }, "40%": { transform: "translateY(-6px)" } },
      },
      animation: {
        "slide-in": "slideIn 0.2s ease",
        "fade-in":  "fadeIn 0.3s ease",
        "spin-fast": "spin 0.7s linear infinite",
        "bounce":   "bounce 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
