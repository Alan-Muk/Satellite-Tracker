import { useEffect, useState } from "react";

import type { Satellite, OrbitRegion } from "../api";

interface Props {
  satellites: Satellite[];
}

export function useSatelliteFilters({ satellites }: Props) {
  const [selectedGroup, setSelectedGroup] = useState("ALL");

  const [selectedRegion, setSelectedRegion] = useState<OrbitRegion | "ALL">(
    "ALL",
  );

  const [highlightedIds, setHighlightedIds] = useState<number[]>([]);

  useEffect(() => {
    if (selectedGroup === "ALL") {
      setSelectedRegion("ALL");

      return;
    }

    const matching = satellites.filter(
      (satellite) => satellite.group === selectedGroup,
    );

    const counts = matching.reduce(
      (
        acc,

        satellite,
      ) => {
        const region = satellite.orbit?.region;

        if (region) {
          acc[region] = (acc[region] ?? 0) + 1;
        }

        return acc;
      },

      {} as Record<string, number>,
    );

    const dominant = Object.entries(counts)

      .sort(
        (
          a,

          b,
        ) => b[1] - a[1],
      )[0];

    if (dominant) {
      setSelectedRegion(dominant[0] as OrbitRegion);
    }
  }, [selectedGroup, satellites]);

  useEffect(() => {
    const filtered = satellites.filter((satellite) => {
      const groupMatch =
        selectedGroup === "ALL" || satellite.group === selectedGroup;

      const orbitMatch =
        selectedRegion === "ALL" || satellite.orbit?.region === selectedRegion;

      return groupMatch && orbitMatch;
    });

    setHighlightedIds(filtered.map((satellite) => satellite.norad_id));
  }, [satellites, selectedGroup, selectedRegion]);

  return {
    selectedGroup,

    setSelectedGroup,

    selectedRegion,

    setSelectedRegion,

    highlightedIds,
  };
}
