import { useEffect, useState } from "react";

import { getPrediction as fetchPrediction } from "../api";
import type { OrbitPrediction } from "../api";

import {
  getPrediction as getCachedPrediction,
  setPrediction,
} from "../components/globe/predictionStore";

export function useSatellitePrediction(noradId: number | null) {
  const [prediction, setPredictionState] = useState<
    OrbitPrediction | undefined
  >(undefined);

  useEffect(() => {
    if (noradId === null) {
      setPredictionState(undefined);
      return;
    }

    const cached = getCachedPrediction(noradId);

    if (cached) {
      setPredictionState(cached);
      return;
    }

    let cancelled = false;

    fetchPrediction(noradId)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setPrediction(result);
        setPredictionState(result);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [noradId]);

  return prediction;
}
