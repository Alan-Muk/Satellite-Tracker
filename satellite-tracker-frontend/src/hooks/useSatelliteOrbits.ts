import { useEffect, useState } from "react";
import { getSatelliteOrbits } from "../api";
import type { SatelliteOrbits } from "../api";

export function useSatelliteOrbits() {
  const [orbits, setOrbits] = useState<SatelliteOrbits>({});

  useEffect(() => {
    let cancelled = false;
    getSatelliteOrbits()
      .then((result) => {
        if (!cancelled) setOrbits(result);
      })
      .catch((error) => {
        if (!cancelled) console.error("Failed to load satellite orbits", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return orbits;
}
