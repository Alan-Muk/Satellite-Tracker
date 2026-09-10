import { useEffect, useMemo, useState } from "react";

import type { Satellite } from "../api";

interface Props {
  satellites: Satellite[];

  highlightedIds: number[];
}

export function useSatelliteSelection({
  satellites,

  highlightedIds,
}: Props) {
  const [selectedNorad, setSelectedNorad] = useState<number | null>(null);

  //
  // Select first satellite on startup
  //

  useEffect(() => {
    if (satellites.length > 0 && selectedNorad === null) {
      setSelectedNorad(satellites[0].norad_id);
    }
  }, [satellites, selectedNorad]);

  //
  // Keep selection inside filtered list
  //

  useEffect(() => {
    if (highlightedIds.length === 0) {
      return;
    }

    const exists = highlightedIds.includes(selectedNorad ?? -1);

    if (!exists) {
      setSelectedNorad(highlightedIds[0]);
    }
  }, [highlightedIds, selectedNorad]);

  //
  // Dropdown ordering
  //

  const selectorSatellites = useMemo(() => {
    return [...satellites].sort((a, b) => {
      const aHighlighted = highlightedIds.includes(a.norad_id);

      const bHighlighted = highlightedIds.includes(b.norad_id);

      const aSelected = a.norad_id === selectedNorad;

      const bSelected = b.norad_id === selectedNorad;

      if (aSelected && !bSelected) {
        return -1;
      }

      if (!aSelected && bSelected) {
        return 1;
      }

      if (aHighlighted && !bHighlighted) {
        return -1;
      }

      if (!aHighlighted && bHighlighted) {
        return 1;
      }

      return a.name.localeCompare(b.name);
    });
  }, [satellites, highlightedIds, selectedNorad]);

  return {
    selectedNorad,

    setSelectedNorad,

    selectorSatellites,
  };
}
