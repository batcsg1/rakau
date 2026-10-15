// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*"],
  },
  {
    rules: {
      // Guards against HTML typos on the web; apostrophes in React Native <Text> are fine as-is
      "react/no-unescaped-entities": "off",
      // The fetch effects reset `loading` before each request; kept visible until they're reworked
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
