import { useEffect, useState } from "react";

import { getSatellites, getSatelliteGroups } from "../api";

import type { Satellite, SatelliteGroups, OrbitRegion } from "../api";

const SATELLITES_PER_REGION = 100;

const ORBIT_REGIONS: OrbitRegion[] = ["VLEO", "LEO", "MEO", "GEO", "HEO"];

function selectSatellitesByRegion(satellites: Satellite[]): Satellite[] {
  const selected: Satellite[] = [];

  for (const region of ORBIT_REGIONS) {
    const regionSatellites = satellites.filter(
      (satellite) => satellite.orbit?.region === region,
    );

    selected.push(...regionSatellites.slice(0, SATELLITES_PER_REGION));
  }

  return selected;
}

export function useSatelliteData() {
  const [satellites, setSatellites] = useState<Satellite[]>([]);

  const [groups, setGroups] = useState<SatelliteGroups>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [allSatellites, satelliteGroups] = await Promise.all([
          getSatellites(1000),
          getSatelliteGroups(),
        ]);

        if (cancelled) {
          return;
        }

        setSatellites(selectSatellitesByRegion(allSatellites));

        setGroups(satelliteGroups);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    satellites,

    groups,
  };
}
