import { useSatellitePrediction } from "./useSatellitePrediction";

export function useActiveSatellitePrediction(noradId: number | null) {
  return useSatellitePrediction(noradId);
}
