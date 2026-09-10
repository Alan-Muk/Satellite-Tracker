import { useEffect, useState } from "react";

import { getSatelliteGroups } from "../api";

export function useSatelliteGroups() {
  const [groups, setGroups] = useState<Record<string, number>>({});

  useEffect(() => {
    getSatelliteGroups().then(setGroups).catch(console.error);
  }, []);

  return groups;
}
