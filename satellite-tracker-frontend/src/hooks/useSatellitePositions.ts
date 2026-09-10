import { useEffect, useState } from "react";

import { getPosition } from "../api";

import type { Satellite, SatellitePosition } from "../api";

interface Props {
  satellites: Satellite[];

  selectedNorad: number | null;
}

export function useSatellitePositions({
  satellites,

  selectedNorad,
}: Props) {
  const [visiblePositions, setVisiblePositions] = useState<SatellitePosition[]>(
    [],
  );

  const [position, setPosition] = useState<SatellitePosition | null>(null);

  //
  // Load all satellites once
  //

  useEffect(() => {
    async function loadPositions() {
      const results = await Promise.allSettled(
        satellites.map((satellite) => getPosition(satellite.norad_id)),
      );

      const positions = results

        .filter((result) => result.status === "fulfilled")

        .map((result) => result.value);

      setVisiblePositions(positions);
    }

    if (satellites.length > 0) {
      loadPositions().catch(console.error);
    }
  }, [satellites]);

  //
  // Poll selected satellite
  //

  useEffect(() => {
    if (selectedNorad === null) {
      return;
    }

    async function load() {
      if (selectedNorad === null) {
        return;
      }

      const noradId = selectedNorad;

      const data = await getPosition(noradId);

      setPosition(data);
    }

    load().catch(console.error);

    const timer = setInterval(
      () => {
        load().catch(console.error);
      },

      5000,
    );

    return () => clearInterval(timer);
  }, [selectedNorad]);

  return {
    visiblePositions,

    position,
  };
}
