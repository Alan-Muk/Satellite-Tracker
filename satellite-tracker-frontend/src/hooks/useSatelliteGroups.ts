import { useEffect, useState } from "react";
import { getSatelliteGroups } from "../api";
import type { SatelliteGroups } from "../api";

export function useSatelliteGroups() {
  const [groups, setGroups] = useState<SatelliteGroups>({});

  useEffect(() => {
    let cancelled = false;
    getSatelliteGroups()
      .then((result) => {
        if (!cancelled) setGroups(result);
      })
      .catch((error) => {
        if (!cancelled) console.error("Failed to load satellite groups", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return groups;
}
