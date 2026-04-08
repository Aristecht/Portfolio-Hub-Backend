export interface LocationInfo {
  country: string;
  city: string;
  latitude: string | number;
  longtitude: string | number;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  type: string;
}

export interface SessionMetadata {
  location: LocationInfo;
  device: DeviceInfo;
  ip: string;
}
