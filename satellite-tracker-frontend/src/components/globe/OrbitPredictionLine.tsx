import type { OrbitPrediction } from "../../api";

export interface OrbitPredictionLineData {
  points: {
    latitude: number;
    longitude: number;
    altitude_km: number;
  }[];

  color: string;

  width: number;
}

interface Props {
  prediction: OrbitPrediction;
}

export default function OrbitPredictionLine({
  prediction,
}: Props): OrbitPredictionLineData | null {
  if (!prediction?.points || prediction.points.length < 2) {
    return null;
  }

  return {
    points: prediction.points.map((point) => ({
      latitude: point.latitude,

      longitude: point.longitude,

      altitude_km: point.altitude_km,
    })),

    color: "rgba(0, 200, 255, 0.55)",

    width: 1,
  };
}
