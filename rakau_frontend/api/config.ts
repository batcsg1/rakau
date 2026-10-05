// Set EXPO_PUBLIC_API_URL in .env to reach the API from a device or emulator,
// e.g. http://<your-LAN-IP>:8000/api — 127.0.0.1 only works for web and the iOS simulator.
// On the Android emulator, `adb reverse tcp:8000 tcp:8000` makes localhost work too.
// Trailing slashes are stripped because every request path already starts with "/"
export const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");
