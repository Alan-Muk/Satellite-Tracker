import { useSatellitePrediction } from "./useSatellitePrediction";

/**
 * Thin alias for the "currently selected satellite" case.
 * Exists only to make call sites read clearly; behavior is
 * identical to useSatellitePrediction.
 */
export function useActiveSatellitePrediction(noradId: number | null) {
  return useSatellitePrediction(noradId);
}
