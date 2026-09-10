export const VISUAL_ALTITUDE_SCALE = 3;

export interface RenderPosition {
  lat: number;

  lng: number;

  altitude: number;
}

export function renderPosition(
  longitude: number,

  latitude: number,

  altitudeKm: number,
): RenderPosition {
  return {
    lat: latitude,

    lng: longitude,

    altitude: (altitudeKm * VISUAL_ALTITUDE_SCALE) / 6378.137,
  };
}
