export const EARTH_RADIUS_KM = 6378.137;

export const VISUAL_ALTITUDE_SCALE = 3;

export interface RenderPosition {
  lat: number;
  lng: number;
  altitude: number;
}

export function altitudeToGlobeUnits(altitudeKm: number): number {
  return (altitudeKm * VISUAL_ALTITUDE_SCALE) / EARTH_RADIUS_KM;
}

export function renderPosition(
  longitude: number,
  latitude: number,
  altitudeKm: number,
): RenderPosition {
  return {
    lat: latitude,
    lng: longitude,
    altitude: altitudeToGlobeUnits(altitudeKm),
  };
}
