const colors = require("./constants/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      // Each weight is a separate family: React Native can't pick weights of a custom font via fontWeight
      fontFamily: {
        iosevka: ["Iosevka-Regular"],
        "iosevka-semibold": ["Iosevka-SemiBold"],
        "iosevka-bold": ["Iosevka-Bold"],
      },
    },
  },
  plugins: [],
};
