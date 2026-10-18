import * as Location from "expo-location";

export interface DevicePosition {
  latitude: number;
  longitude: number;
  accuracyM: number | null; // radius in metres the device is confident within, if it reports one
}

// A failure the user can act on; the message is shown as-is in the form
export class DeviceLocationError extends Error {}

// The phone's current GPS position, asking for "while using the app" permission first
export async function getCurrentPosition(): Promise<DevicePosition> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) {
    throw new DeviceLocationError(
      "Location permission was denied. Allow it in your phone's settings, or type the coordinates in.",
    );
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    throw new DeviceLocationError("Location services are turned off. Turn them on and try again.");
  }

  try {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return { latitude: coords.latitude, longitude: coords.longitude, accuracyM: coords.accuracy };
  } catch {
    throw new DeviceLocationError("Couldn't get your location. Try again outside, or type it in.");
  }
}
