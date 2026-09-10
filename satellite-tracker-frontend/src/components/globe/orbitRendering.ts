import type { OrbitPoint } from "../../api";

export interface GlobeOrbitPoint {
  latitude: number;

  longitude: number;

  altitude_km: number;
}

export function orbitPointToGlobePoint(point: OrbitPoint): GlobeOrbitPoint {
  return {
    latitude: point.latitude,

    longitude: point.longitude,

    altitude_km: point.altitude_km,
  };
}

export function orbitPointsToGlobePoints(
  points: OrbitPoint[],
): GlobeOrbitPoint[] {
  return points.map(orbitPointToGlobePoint);
}
