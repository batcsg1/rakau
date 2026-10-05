// Set EXPO_PUBLIC_API_URL in .env to reach the API from a device or emulator,
// e.g. http://<your-LAN-IP>:8000/api — 127.0.0.1 only works for web and the iOS simulator
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
