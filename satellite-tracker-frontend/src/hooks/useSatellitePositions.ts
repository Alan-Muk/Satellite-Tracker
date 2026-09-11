import { useEffect, useState } from "react";

import { getPosition } from "../api";

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

  //
  // Load the current position of every
  // visible satellite.
  //
  useEffect(() => {
    let cancelled = false;

    async function loadPositions() {
      const results = await Promise.allSettled(
        satellites.map((satellite) => getPosition(satellite.norad_id)),
      );

      if (cancelled) {
        return;
      }

      const positions = results
        .filter(
          (result): result is PromiseFulfilledResult<SatellitePosition> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value);

      setVisiblePositions(positions);
    }

    if (satellites.length === 0) {
      setVisiblePositions([]);
      return;
    }

    loadPositions().catch((error) => {
      if (!cancelled) {
        console.error(error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [satellites]);

  //
  // Keep the selected satellite's
  // telemetry current.
  //
  useEffect(() => {
    if (selectedNorad === null) {
      setPosition(null);
      return;
    }

    let cancelled = false;

    const noradId = selectedNorad;

    async function load() {
      const data = await getPosition(noradId);

      setPosition(data);
    }

    load().catch((error) => {
      if (!cancelled) {
        console.error(error);
      }
    });

    const timer = window.setInterval(() => {
      load().catch((error) => {
        if (!cancelled) {
          console.error(error);
        }
      });
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedNorad]);

  return {
    visiblePositions,
    position,
  };
}
