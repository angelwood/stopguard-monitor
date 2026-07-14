// StopGuard GPS Capture Module
// Captures location data at the start of a traffic stop for documentation.

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  formattedAddress?: string;
}

export class GPSCapture {
  isSupported(): boolean {
    return "geolocation" in navigator;
  }

  capture(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (err) => {
          reject(new Error(err.message || "GPS capture failed"));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  formatLocation(loc: LocationData): string {
    const latStr = loc.latitude.toFixed(6);
    const lonStr = loc.longitude.toFixed(6);
    const accStr = Math.round(loc.accuracy);
    return `${latStr}, ${lonStr} (±${accStr}m)`;
  }

  mapsUrl(loc: LocationData): string {
    return `https://maps.google.com/?q=${loc.latitude},${loc.longitude}`;
  }
}
