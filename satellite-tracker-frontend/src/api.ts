export type SatelliteGroup =
  | "STARLINK"
  | "ONEWEB"
  | "ISS"
  | "GPS"
  | "WEATHER"
  | "IRIDIUM"
  | "DEBRIS"
  | "OTHER";

export type OrbitRegion = "VLEO" | "LEO" | "MEO" | "GEO" | "HEO" | "UNKNOWN";

export type SatelliteGroups = Partial<Record<SatelliteGroup, number>>;

export type SatelliteOrbits = Partial<Record<OrbitRegion, number>>;

export interface OrbitMetadata {
  altitude_km: number;
  inclination_deg: number;
  period_minutes: number;
  region: OrbitRegion;
}

export interface Satellite {
  norad_id: number;
  name: string;
  group: SatelliteGroup;
  orbit?: OrbitMetadata;
}

export interface SatellitePosition {
  norad_id: number;
  latitude: number;
  longitude: number;
  altitude_km: number;
  velocity_km_s: number;
  timestamp: string;
}

export interface OrbitPrediction {
  norad_id: number;
  generated_at: string;
  duration_minutes: number;
  step_seconds: number;
  points: SatellitePosition[];
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function getSatellites(limit = 5000): Promise<Satellite[]> {
  const params = new URLSearchParams();
  params.set("limit", limit.toString());

  const response = await fetch(`${API_BASE}/satellites?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch satellites: ${response.status}`);
  }
  return response.json();
}

export async function getPosition(noradId: number): Promise<SatellitePosition> {
  const response = await fetch(`${API_BASE}/satellites/${noradId}/position`);
  if (!response.ok) {
    throw new Error(`Failed to fetch satellite position: ${response.status}`);
  }
  return response.json();
}

export async function getPositions(
  ids: number[],
): Promise<SatellitePosition[]> {
  if (ids.length === 0) return [];

  const params = new URLSearchParams();
  params.set("ids", ids.join(","));

  const response = await fetch(`${API_BASE}/satellites/positions?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch satellite positions: ${response.status}`);
  }
  return response.json();
}

export async function getPrediction(
  noradId: number,
  signal?: AbortSignal,
): Promise<OrbitPrediction> {
  const response = await fetch(`${API_BASE}/satellites/${noradId}/prediction`, {
    signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch satellite prediction: ${response.status}`);
  }
  return response.json();
}

export async function getSatelliteGroups(): Promise<SatelliteGroups> {
  const response = await fetch(`${API_BASE}/satellites/groups`);
  if (!response.ok) {
    throw new Error(`Failed to fetch satellite groups: ${response.status}`);
  }
  return response.json();
}

export async function getSatelliteOrbits(): Promise<SatelliteOrbits> {
  const response = await fetch(`${API_BASE}/satellites/orbits`);
  if (!response.ok) {
    throw new Error(`Failed to fetch satellite orbits: ${response.status}`);
  }
  return response.json();
}
