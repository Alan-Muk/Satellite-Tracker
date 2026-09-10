import { useEffect, useState } from "react";

import { getSatellites, getSatelliteGroups } from "../api";

import type { Satellite } from "../api";

export function useSatellites() {
  const [satellites, setSatellites] = useState<Satellite[]>([]);

  const [groups, setGroups] = useState<Record<string, number>>({});

  useEffect(() => {
    getSatellites().then(setSatellites).catch(console.error);
  }, []);

  useEffect(() => {
    getSatelliteGroups().then(setGroups).catch(console.error);
  }, []);

  return {
    satellites,
    groups,
  };
}
