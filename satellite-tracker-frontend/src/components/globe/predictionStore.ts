import type { OrbitPrediction } from "../../api";

const predictions = new Map<number, OrbitPrediction>();
const listeners = new Set<() => void>();

function notify() {
  // Snapshot so a listener that unsubscribes mid-notify is safe.
  for (const listener of [...listeners]) listener();
}

export function setPrediction(prediction: OrbitPrediction) {
  const existing = predictions.get(prediction.norad_id);
  // Skip if it's literally the same reference — avoids redundant
  // re-renders when the network returns a cached object.
  if (existing === prediction) return;

  predictions.set(prediction.norad_id, prediction);
  notify();
}

export function getPrediction(noradId: number): OrbitPrediction | undefined {
  return predictions.get(noradId);
}

export function subscribePrediction(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearPrediction(noradId: number) {
  if (predictions.delete(noradId)) notify();
}

export function clearPredictions() {
  if (predictions.size === 0) return;
  predictions.clear();
  notify();
}
