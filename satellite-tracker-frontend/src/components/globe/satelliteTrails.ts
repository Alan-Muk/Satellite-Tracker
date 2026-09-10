import type { AnimatedSatellitePosition } from "./SatelliteAnimator";

export const trails = new Map<number, AnimatedSatellitePosition[]>();

export const fullOrbitTrails = new Set<number>();

//
// Full orbit display
//

export function enableFullOrbitTrail(noradId: number) {
  fullOrbitTrails.add(noradId);
}

export function disableFullOrbitTrail(noradId: number) {
  fullOrbitTrails.delete(noradId);
}

//
// Add satellite movement point
//

export function pushTrail(
  noradId: number,
  position: AnimatedSatellitePosition,
) {
  let trail = trails.get(noradId);

  if (!trail) {
    trail = [];

    trails.set(noradId, trail);
  }

  trail.push(position);

  const limit = fullOrbitTrails.has(noradId) ? 720 : 80;

  if (trail.length > limit) {
    trail.shift();
  }
}

//
// Randomly create the atomic orbit effect
//

export function assignRandomOrbitTrails(noradIds: number[], percentage = 0.05) {
  for (const noradId of noradIds) {
    if (Math.random() < percentage) {
      enableFullOrbitTrail(noradId);
    }
  }
}

//
// Remove stale satellites
//

export function syncTrails(activeNoradIds: number[]) {
  const active = new Set(activeNoradIds);

  for (const noradId of trails.keys()) {
    if (!active.has(noradId)) {
      trails.delete(noradId);

      fullOrbitTrails.delete(noradId);
    }
  }
}

//
// Clear everything
//

export function clearTrails() {
  trails.clear();

  fullOrbitTrails.clear();
}
