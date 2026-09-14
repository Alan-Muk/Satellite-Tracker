import type { OrbitRegion } from "../../api";

export interface Region {
  name: OrbitRegion;
  altitudeKm: number;
  color: string;
}

export const regions: Region[] = [
  { name: "VLEO", altitudeKm: 150, color: "#00ffff" },
  { name: "LEO", altitudeKm: 800, color: "#00aaff" },
  { name: "MEO", altitudeKm: 10000, color: "#bb55ff" },
  { name: "GEO", altitudeKm: 35786, color: "#ffaa00" },
  { name: "HEO", altitudeKm: 20000, color: "#ff3366" },
];

export const ORBIT_REGIONS: OrbitRegion[] = regions.map((r) => r.name);

export const regionAltitudes: Record<OrbitRegion, number> = regions.reduce(
  (acc, r) => {
    acc[r.name] = r.altitudeKm;
    return acc;
  },
  {} as Record<OrbitRegion, number>,
);
