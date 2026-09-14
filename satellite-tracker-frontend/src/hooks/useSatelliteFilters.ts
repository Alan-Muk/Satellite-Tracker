import { useMemo, useState } from "react";

import type { Satellite, SatelliteGroup, OrbitRegion } from "../api";

interface Props {
  satellites: Satellite[];
}

export function useSatelliteFilters({ satellites }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<SatelliteGroup | "ALL">(
    "ALL",
  );
  const [selectedRegion, setSelectedRegion] = useState<OrbitRegion | "ALL">(
    "ALL",
  );

  const highlightedIds = useMemo(() => {
    return satellites
      .filter((satellite) => {
        const groupMatch =
          selectedGroup === "ALL" || satellite.group === selectedGroup;
        const orbitMatch =
          selectedRegion === "ALL" ||
          satellite.orbit?.region === selectedRegion;
        return groupMatch && orbitMatch;
      })
      .map((s) => s.norad_id);
  }, [satellites, selectedGroup, selectedRegion]);

  return {
    selectedGroup,
    setSelectedGroup,
    selectedRegion,
    setSelectedRegion,
    highlightedIds,
  };
}
