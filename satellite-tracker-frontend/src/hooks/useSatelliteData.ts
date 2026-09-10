import { useEffect, useState } from "react";

import { getSatellites, getSatelliteGroups } from "../api";

import type { Satellite, SatelliteGroups } from "../api";

export function useSatelliteData() {
  const [satellites, setSatellites] = useState<Satellite[]>([]);

  const [groups, setGroups] = useState<SatelliteGroups>({});

  useEffect(() => {
    getSatellites()
      .then(setSatellites)

      .catch(console.error);

    getSatelliteGroups()
      .then(setGroups)

      .catch(console.error);
  }, []);

  return {
    satellites,

    groups,
  };
}
