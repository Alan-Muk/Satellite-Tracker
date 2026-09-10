export interface OrbitPoint {
  latitude: number;

  longitude: number;

  altitude_km: number;
}

export interface AnimatedSatellite {
  norad_id: number;

  prediction: OrbitPoint[];

  step_seconds: number;

  elapsed_seconds: number;
}

export interface AnimatedSatellitePosition {
  latitude: number;

  longitude: number;

  altitude_km: number;
}

export type SatellitePositionUpdater = (
  noradId: number,

  position: AnimatedSatellitePosition,
) => void;

function randomRange(
  min: number,

  max: number,
) {
  return Math.random() * (max - min) + min;
}

function normalizeLongitude(longitude: number) {
  let value = longitude % 360;

  if (value > 180) {
    value -= 360;
  }

  if (value < -180) {
    value += 360;
  }

  return value;
}

export function generateOrbit(
  altitude_km: number,

  inclination = 45,

  points = 360,

  phase = 0,
): OrbitPoint[] {
  const orbit: OrbitPoint[] = [];

  const eccentricity = altitude_km > 15000 ? 0.35 : 0.05;

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 + phase;

    const orbitalRadius = altitude_km * (1 + Math.sin(angle) * eccentricity);

    const latitude = Math.sin(angle) * inclination;

    const longitude = normalizeLongitude(
      (angle * 180) / Math.PI + randomRange(-180, 180),
    );

    orbit.push({
      latitude,

      longitude,

      altitude_km: orbitalRadius,
    });
  }

  return orbit;
}

export function createAnimatedSatellite(
  norad_id: number,

  altitude_km: number,

  step_seconds = 10,
): AnimatedSatellite {
  const minimumStep = Math.min(5, step_seconds);

  const maximumStep = Math.max(minimumStep, step_seconds);

  return {
    norad_id,

    prediction: generateOrbit(
      altitude_km,

      randomRange(20, 100),

      360,

      Math.random() * Math.PI * 2,
    ),

    step_seconds: randomRange(minimumStep, maximumStep),

    elapsed_seconds: Math.random() * 3600,
  };
}

export class SatelliteAnimator {
  private updatePosition: SatellitePositionUpdater;

  constructor(updatePosition: SatellitePositionUpdater) {
    this.updatePosition = updatePosition;
  }

  update(
    satellites: AnimatedSatellite[],

    deltaSeconds: number,
  ) {
    for (const satellite of satellites) {
      const points = satellite.prediction;

      if (points.length < 2) {
        continue;
      }

      if (satellite.step_seconds <= 0) {
        continue;
      }

      satellite.elapsed_seconds += deltaSeconds;

      const duration = points.length * satellite.step_seconds;

      satellite.elapsed_seconds %= duration;

      const exactIndex = satellite.elapsed_seconds / satellite.step_seconds;

      const index = Math.floor(exactIndex);

      const fraction = exactIndex - index;

      const current = points[index % points.length];

      const next = points[(index + 1) % points.length];

      const latitude = this.interpolate(
        current.latitude,

        next.latitude,

        fraction,
      );

      const longitude = this.interpolateLongitude(
        current.longitude,

        next.longitude,

        fraction,
      );

      const altitude = this.interpolate(
        current.altitude_km,

        next.altitude_km,

        fraction,
      );

      this.updatePosition(
        satellite.norad_id,

        {
          latitude,

          longitude,

          altitude_km: altitude,
        },
      );
    }
  }

  private interpolate(
    a: number,

    b: number,

    amount: number,
  ) {
    return a + (b - a) * amount;
  }

  private interpolateLongitude(
    a: number,

    b: number,

    amount: number,
  ) {
    let difference = b - a;

    if (difference > 180) {
      difference -= 360;
    }

    if (difference < -180) {
      difference += 360;
    }

    return normalizeLongitude(a + difference * amount);
  }
}
