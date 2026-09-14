import { useEffect, useSyncExternalStore } from "react";

import { getPrediction as fetchPrediction } from "../api";
import type { OrbitPrediction } from "../api";

import {
  getPrediction as getStoredPrediction,
  setPrediction,
  subscribePrediction,
} from "../components/globe/predictionStore";

export function useSatellitePrediction(
  noradId: number | null,
): OrbitPrediction | undefined {
  const prediction = useSyncExternalStore(subscribePrediction, () =>
    noradId === null ? undefined : getStoredPrediction(noradId),
  );

  useEffect(() => {
    if (noradId === null) return;
    if (getStoredPrediction(noradId)) return;

    let cancelled = false;
    fetchPrediction(noradId)
      .then((result) => {
        if (!cancelled) setPrediction(result);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(`Failed to load prediction for ${noradId}`, error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [noradId]);

  return prediction;
}
