import { useEffect, useState } from "react";

import { getPosition, getPositions } from "../api";
import type { Satellite, SatellitePosition } from "../api";

interface Props {
  satellites: Satellite[];
  selectedNorad: number | null;
}

export function useSatellitePositions({ satellites, selectedNorad }: Props) {
  const [visiblePositions, setVisiblePositions] = useState<SatellitePosition[]>(
    [],
  );
  const [position, setPosition] = useState<SatellitePosition | null>(null);

  const satelliteIdKey = satellites.map((s) => s.norad_id).join(",");

  useEffect(() => {
    let cancelled = false;

    if (satellites.length === 0) {
      setVisiblePositions([]);
      return;
    }

    async function loadPositions() {
      try {
        const ids = satellites.map((s) => s.norad_id);
        const positions = await getPositions(ids);
        if (!cancelled) setVisiblePositions(positions);
      } catch (error) {
        if (!cancelled) console.error("Failed to load positions", error);
      }
    }

    loadPositions();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satelliteIdKey]);

  useEffect(() => {
    if (selectedNorad === null) {
      setPosition(null);
      return;
    }

    let cancelled = false;
    const noradId = selectedNorad;

    async function load() {
      try {
        const data = await getPosition(noradId);
        if (!cancelled) setPosition(data);
      } catch (error) {
        if (!cancelled)
          console.error(`Failed to load position for ${noradId}`, error);
      }
    }

    load();
    const timer = window.setInterval(load, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedNorad]);

  return { visiblePositions, position };
}
