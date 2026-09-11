import type { AnimatedSatellitePosition } from "./SatelliteAnimator";

import type { OrbitRegion, Satellite } from "../../api";

export interface TrailBuffer {
  points: Array<AnimatedSatellitePosition | undefined>;

  writeIndex: number;

  size: number;

  capacity: number;
}

export const trails = new Map<number, TrailBuffer>();

/*

NORAD IDs that should have their complete
orbital path rendered.
This is currently a selection set only.
The actual trail data still comes from
the rolling trail buffers.
*/
export const fullOrbitTrails = new Set<number>();

const NORMAL_TRAIL_SIZE = 80;

const FULL_ORBIT_TRAIL_SIZE = 360;

export const FULL_ORBITS_PER_REGION = 6;

const ORBIT_REGIONS: OrbitRegion[] = ["VLEO", "LEO", "MEO", "GEO", "HEO"];

function createTrail(capacity: number): TrailBuffer {
  return {
    points: new Array<AnimatedSatellitePosition | undefined>(capacity),

    writeIndex: 0,

    size: 0,

    capacity,
  };
}

function getOrderedPoints(trail: TrailBuffer): AnimatedSatellitePosition[] {
  if (trail.size === 0) {
    return [];
  }

  const result = new Array<AnimatedSatellitePosition>(trail.size);

  const start = trail.size < trail.capacity ? 0 : trail.writeIndex;

  for (let i = 0; i < trail.size; i++) {
    const point = trail.points[(start + i) % trail.capacity];

    if (point) {
      result[i] = point;
    }
  }

  return result;
}

function resizeTrail(trail: TrailBuffer, capacity: number) {
  if (trail.capacity === capacity) {
    return;
  }

  const existing = getOrderedPoints(trail);

  const retained = existing.slice(Math.max(0, existing.length - capacity));

  trail.points = new Array<AnimatedSatellitePosition | undefined>(capacity);

  trail.capacity = capacity;

  trail.size = retained.length;

  trail.writeIndex = retained.length % capacity;

  for (let i = 0; i < retained.length; i++) {
    trail.points[i] = retained[i];
  }
}

export function enableFullOrbitTrail(noradId: number) {
  fullOrbitTrails.add(noradId);

  const trail = trails.get(noradId);

  if (trail) {
    resizeTrail(trail, FULL_ORBIT_TRAIL_SIZE);
  }
}

export function disableFullOrbitTrail(noradId: number) {
  fullOrbitTrails.delete(noradId);

  const trail = trails.get(noradId);

  if (trail) {
    resizeTrail(trail, NORMAL_TRAIL_SIZE);
  }
}

/**

Select six satellites from every
populated orbital region.
Selection is deterministic:
satellites are sorted by NORAD ID
within each region.
Only satellites supplied to this
function are eligible.
*/
export function assignFullOrbitSatellites(satellites: Satellite[]) {
  fullOrbitTrails.clear();

  const byRegion = new Map<OrbitRegion, Satellite[]>();

  for (const region of ORBIT_REGIONS) {
    byRegion.set(region, []);
  }

  for (const satellite of satellites) {
    const region = satellite.orbit?.region;

    if (!region) {
      continue;
    }

    const group = byRegion.get(region);

    if (!group) {
      continue;
    }

    group.push(satellite);
  }

  for (const region of ORBIT_REGIONS) {
    const group = byRegion.get(region) ?? [];

    group.sort((a, b) => a.norad_id - b.norad_id);

    const count = Math.min(FULL_ORBITS_PER_REGION, group.length);

    for (let i = 0; i < count; i++) {
      fullOrbitTrails.add(group[i].norad_id);
    }
  }

  /*

Existing trail buffers need to follow
the new selection.
*/
  for (const [noradId, trail] of trails) {
    if (fullOrbitTrails.has(noradId)) {
      resizeTrail(trail, FULL_ORBIT_TRAIL_SIZE);
    } else {
      resizeTrail(trail, NORMAL_TRAIL_SIZE);
    }
  }
}

export function pushTrail(
  noradId: number,
  position: AnimatedSatellitePosition,
) {
  let trail = trails.get(noradId);

  if (!trail) {
    trail = createTrail(
      fullOrbitTrails.has(noradId) ? FULL_ORBIT_TRAIL_SIZE : NORMAL_TRAIL_SIZE,
    );

    trails.set(noradId, trail);
  }

  trail.points[trail.writeIndex] = position;

  trail.writeIndex = (trail.writeIndex + 1) % trail.capacity;

  trail.size = Math.min(trail.size + 1, trail.capacity);
}

export function getTrailPoints(
  trail: TrailBuffer,
): AnimatedSatellitePosition[] {
  return getOrderedPoints(trail);
}

export function syncTrails(activeNoradIds: number[]) {
  const active = new Set(activeNoradIds);

  /*

Remove trail buffers for satellites
that are no longer displayed.
*/
  for (const noradId of trails.keys()) {
    if (!active.has(noradId)) {
      trails.delete(noradId);
    }
  }

  /*

Remove full-orbit assignments for
satellites that are no longer displayed.
*/
  for (const noradId of fullOrbitTrails) {
    if (!active.has(noradId)) {
      fullOrbitTrails.delete(noradId);
    }
  }
}

export function clearTrails() {
  trails.clear();

  fullOrbitTrails.clear();
}
