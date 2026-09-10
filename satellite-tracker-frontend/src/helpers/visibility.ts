import type { Satellite } from "../api";

export function chooseVisibleSatellites(
  satellites: Satellite[],
  pinned: number[],
): Satellite[] {
  const pinnedSatellites = satellites.filter((satellite) =>
    pinned.includes(satellite.norad_id),
  );

  const remaining = satellites.filter(
    (satellite) => !pinned.includes(satellite.norad_id),
  );

  const shuffled = [...remaining].sort(() => Math.random() - 0.5);

  return [
    ...pinnedSatellites.slice(0, 10),
    ...shuffled.slice(0, Math.max(0, 50 - pinnedSatellites.length)),
  ];
}
