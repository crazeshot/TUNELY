/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'gg sans'", "'ggsans'", "'Plus Jakarta Sans'", "sans-serif"],
        display: ["'gg sans'", "'ggsans'", "'Plus Jakarta Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
}