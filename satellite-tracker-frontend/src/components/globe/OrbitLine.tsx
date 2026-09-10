import type { OrbitPrediction } from "../../api";

export interface OrbitLineData {
  points: OrbitPrediction["points"];

  color: string;

  width: number;
}

interface Props {
  prediction: OrbitPrediction;

  color?: string;

  width?: number;
}

export default function OrbitLine({
  prediction,

  color = "rgba(0, 255, 255, 0.55)",

  width = 2,
}: Props): OrbitLineData | null {
  if (!prediction.points || prediction.points.length < 2) {
    return null;
  }

  return {
    points: prediction.points,

    color,

    width,
  };
}
