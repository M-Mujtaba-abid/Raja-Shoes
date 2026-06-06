/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
      },
      colors: {
        brand: {
          50:  "#fef9ee",
          100: "#fdf0d3",
          200: "#fadfa6",
          300: "#f6c76e",
          400: "#f2a736",
          500: "#ef8f13",
          600: "#e07309",
          700: "#b9580a",
          800: "#944510",
          900: "#793a11",
          950: "#411c06",
        },
        dark: {
          50:  "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#888888",
          500: "#6d6d6d",
          600: "#5d5d5d",
          700: "#4f4f4f",
          800: "#454545",
          900: "#3d3d3d",
          950: "#111111",
        },
      },
    },
  },
  plugins: [],
};
