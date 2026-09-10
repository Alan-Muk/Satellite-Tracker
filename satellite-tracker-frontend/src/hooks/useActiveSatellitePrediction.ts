import { useEffect } from "react";

import { useSatellitePrediction } from "./useSatellitePrediction";

import { setPrediction } from "../components/globe/predictionStore";

export function useActiveSatellitePrediction(noradId: number | null) {
  const prediction = useSatellitePrediction(noradId);

  useEffect(() => {
    if (prediction) {
      setPrediction(prediction);
    }
  }, [prediction]);

  return prediction;
}
