import { useEffect, useState } from "react";

import type { OrbitPrediction } from "../api";

import { getPrediction } from "../components/globe/predictionStore";

export function useSatellitePrediction(noradId: number | null) {
  const [prediction, setPrediction] = useState<OrbitPrediction | undefined>(
    undefined,
  );

  useEffect(() => {
    if (noradId === null) {
      setPrediction(undefined);

      return;
    }

    setPrediction(getPrediction(noradId));
  }, [noradId]);

  return prediction;
}
