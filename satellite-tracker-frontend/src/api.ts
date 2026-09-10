export type SatelliteGroups = Record<string, number>;

export type SatelliteOrbits = Record<string, number>;

export type OrbitRegion = "VLEO" | "LEO" | "MEO" | "GEO" | "HEO" | "UNKNOWN";

export interface OrbitMetadata {
  altitude_km: number;

  inclination_deg: number;

  period_minutes: number;

  region: OrbitRegion;
}

export interface Satellite {
  norad_id: number;

  name: string;

  group: string;

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

export interface OrbitPoint {
  latitude: number;

  longitude: number;

  altitude_km: number;
}

export interface OrbitPrediction {
  norad_id: number;

  generated_at: string;

  duration_minutes: number;

  step_seconds: number;

  points: OrbitPoint[];
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function getSatellites(limit = 500): Promise<Satellite[]> {
  const params = new URLSearchParams();

  params.set("limit", limit.toString());

  const response = await fetch(`${API_BASE}/satellites?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch satellites");
  }

  return response.json();
}

export async function getPosition(noradId: number): Promise<SatellitePosition> {
  const response = await fetch(`${API_BASE}/satellites/${noradId}/position`);

  if (!response.ok) {
    throw new Error("Failed to fetch satellite position");
  }

  return response.json();
}

export async function getPrediction(noradId: number): Promise<OrbitPrediction> {
  const response = await fetch(`${API_BASE}/satellites/${noradId}/prediction`);

  if (!response.ok) {
    throw new Error("Failed to fetch satellite prediction");
  }

  return response.json();
}

export async function getSatelliteGroups(): Promise<SatelliteGroups> {
  const response = await fetch(`${API_BASE}/satellites/groups`);

  if (!response.ok) {
    throw new Error("Failed to fetch satellite groups");
  }

  return response.json();
}

export async function getSatelliteOrbits(): Promise<SatelliteOrbits> {
  const response = await fetch(`${API_BASE}/satellites/orbits`);

  if (!response.ok) {
    throw new Error("Failed to fetch satellite orbit regions");
  }

  return response.json();
}
