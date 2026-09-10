import type { OrbitPrediction } from "../../api";

const predictions = new Map<number, OrbitPrediction>();

const listeners = new Set<() => void>();

export function setPrediction(prediction: OrbitPrediction) {
  predictions.set(
    prediction.norad_id,

    prediction,
  );

  listeners.forEach((listener) => listener());
}

export function getPrediction(noradId: number) {
  return predictions.get(noradId);
}

export function subscribePrediction(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
