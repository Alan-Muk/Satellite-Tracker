export const EARTH_RADIUS_KM = 6378.137;

/**
 * Deliberate visual exaggeration. Real orbital altitudes are
 * invisible at true scale (LEO ≈ 0.12 Earth radii, GEO ≈ 6.6),
 * so everything that renders altitude multiplies by this factor.
 *
 * Every consumer MUST use `altitudeToGlobeUnits` / this constant
 * so shells, markers, trails and the camera all agree.
 */
export const VISUAL_ALTITUDE_SCALE = 3;

export interface RenderPosition {
  lat: number;
  lng: number;
  /** Already in globe units (fraction of globe radius). */
  altitude: number;
}

export function altitudeToGlobeUnits(altitudeKm: number): number {
  return (altitudeKm * VISUAL_ALTITUDE_SCALE) / EARTH_RADIUS_KM;
}

/**
 * NOTE: argument order matches the returned object
 * (latitude, longitude) to avoid accidental swaps.
 */
export function renderPosition(
  latitude: number,
  longitude: number,
  altitudeKm: number,
): RenderPosition {
  return {
    lat: latitude,
    lng: longitude,
    altitude: altitudeToGlobeUnits(altitudeKm),
  };
}
