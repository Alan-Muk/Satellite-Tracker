export interface AnimatedSatellitePosition {
  latitude: number;
  longitude: number;
  altitude_km: number;
}

export interface AnimatedSatellite {
  norad_id: number;
  prediction: AnimatedSatellitePosition[];
  step_seconds: number;
  elapsed_seconds: number;
}

export type SatellitePositionUpdater = (
  noradId: number,
  position: AnimatedSatellitePosition,
) => void;

function interpolate(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

function interpolateLongitude(a: number, b: number, amount: number): number {
  let delta = b - a;
  if (delta > 180) delta -= 360;
  else if (delta < -180) delta += 360;
  return ((((a + delta * amount + 180) % 360) + 360) % 360) - 180;
}

function interpolatePosition(
  current: AnimatedSatellitePosition,
  next: AnimatedSatellitePosition,
  fraction: number,
): AnimatedSatellitePosition {
  return {
    latitude: interpolate(current.latitude, next.latitude, fraction),
    longitude: interpolateLongitude(
      current.longitude,
      next.longitude,
      fraction,
    ),
    altitude_km: interpolate(current.altitude_km, next.altitude_km, fraction),
  };
}

export function createAnimatedSatellite(
  norad_id: number,
  prediction: AnimatedSatellitePosition[],
  step_seconds: number,
  elapsed_seconds = 0,
): AnimatedSatellite {
  return { norad_id, prediction, step_seconds, elapsed_seconds };
}

export function elapsedSincePrediction(
  generatedAt: string,
  stepSeconds: number,
  pointCount: number,
): number {
  if (stepSeconds <= 0 || pointCount < 2) return 0;
  const generatedTime = Date.parse(generatedAt);
  if (!Number.isFinite(generatedTime)) return 0;
  const elapsedSeconds = (Date.now() - generatedTime) / 1000;
  const duration = (pointCount - 1) * stepSeconds;
  if (duration <= 0) return 0;
  return ((elapsedSeconds % duration) + duration) % duration;
}

/**
 * Mutates the `elapsed_seconds` of every satellite it is given.
 * Callers must pass the same array they consider "live" and only
 * run one instance against it.
 */
export class SatelliteAnimator {
  private updatePosition: SatellitePositionUpdater;

  constructor(updatePosition: SatellitePositionUpdater) {
    this.updatePosition = updatePosition;
  }

  update(satellites: AnimatedSatellite[], deltaSeconds: number): void {
    if (deltaSeconds <= 0) return;

    for (const satellite of satellites) {
      const points = satellite.prediction;
      if (points.length < 2 || satellite.step_seconds <= 0) continue;

      satellite.elapsed_seconds += deltaSeconds;

      const duration = (points.length - 1) * satellite.step_seconds;
      if (duration <= 0) continue;

      satellite.elapsed_seconds %= duration;

      const exactIndex = satellite.elapsed_seconds / satellite.step_seconds;
      const index = Math.floor(exactIndex);
      const fraction = exactIndex - index;

      const current = points[index];
      // Wrap the "next" index so the loop seam is continuous.
      const next = points[index + 1] ?? points[0];
      if (!current || !next) continue;

      this.updatePosition(
        satellite.norad_id,
        interpolatePosition(current, next, fraction),
      );
    }
  }
}
