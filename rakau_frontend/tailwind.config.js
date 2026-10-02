/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bark: "#3E2723",
        leaf: "#2E7D32",
        canopy: "#1B5E20",
        sand: "#F5F1E8",
      },
    },
  },
  plugins: [],
};
