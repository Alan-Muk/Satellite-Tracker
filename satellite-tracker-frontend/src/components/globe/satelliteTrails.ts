import type { AnimatedSatellitePosition } from "./SatelliteAnimator";
import type { OrbitRegion, Satellite } from "../../api";
import { ORBIT_REGIONS } from "./orbitRegions";

export interface TrailBuffer {
  points: AnimatedSatellitePosition[];
  writeIndex: number;
  size: number;
  capacity: number;
}

export const trails = new Map<number, TrailBuffer>();
export const fullOrbitTrails = new Set<number>();

export const NORMAL_TRAIL_SIZE = 80;
export const FULL_ORBIT_TRAIL_SIZE = 360;
export const FULL_ORBITS_PER_REGION = 6;

function createTrail(capacity: number): TrailBuffer {
  return { points: [], writeIndex: 0, size: 0, capacity };
}

function getOrderedPoints(trail: TrailBuffer): AnimatedSatellitePosition[] {
  if (trail.size === 0) return [];
  const result = new Array<AnimatedSatellitePosition>(trail.size);
  const start = trail.size < trail.capacity ? 0 : trail.writeIndex;
  for (let i = 0; i < trail.size; i++) {
    result[i] = trail.points[(start + i) % trail.capacity];
  }
  return result;
}

function resizeTrail(trail: TrailBuffer, capacity: number) {
  if (trail.capacity === capacity) return;

  const existing = getOrderedPoints(trail);
  const retained = existing.slice(Math.max(0, existing.length - capacity));

  trail.points = [];
  trail.capacity = capacity;
  trail.size = retained.length;
  trail.writeIndex = retained.length % capacity;

  for (let i = 0; i < retained.length; i++) {
    trail.points[i] = retained[i];
  }
}

export function assignFullOrbitSatellites(satellites: Satellite[]) {
  fullOrbitTrails.clear();

  const byRegion = new Map<OrbitRegion, Satellite[]>();
  for (const region of ORBIT_REGIONS) byRegion.set(region, []);

  for (const satellite of satellites) {
    const region = satellite.orbit?.region;
    if (!region) continue;
    byRegion.get(region)?.push(satellite);
  }

  for (const region of ORBIT_REGIONS) {
    const group = byRegion.get(region) ?? [];
    group.sort((a, b) => a.norad_id - b.norad_id);
    const count = Math.min(FULL_ORBITS_PER_REGION, group.length);
    for (let i = 0; i < count; i++) {
      fullOrbitTrails.add(group[i].norad_id);
    }
  }

  for (const [noradId, trail] of trails) {
    resizeTrail(
      trail,
      fullOrbitTrails.has(noradId) ? FULL_ORBIT_TRAIL_SIZE : NORMAL_TRAIL_SIZE,
    );
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

/** Remove trails for satellites no longer displayed. */
export function syncTrails(activeNoradIds: number[]) {
  const active = new Set(activeNoradIds);
  for (const noradId of trails.keys()) {
    if (!active.has(noradId)) trails.delete(noradId);
  }
  // fullOrbitTrails is owned by assignFullOrbitSatellites.
}

export function clearTrails() {
  trails.clear();
  fullOrbitTrails.clear();
}
