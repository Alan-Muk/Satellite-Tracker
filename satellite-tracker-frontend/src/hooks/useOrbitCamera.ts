import { useCallback } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";

import { altitudeToGlobeUnits } from "../components/globe/rendering";
import { regionAltitudes } from "../components/globe/orbitRegions";

import type { OrbitRegion } from "../api";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;
}

export function useOrbitCamera({ globeRef }: Props) {
  const flyToRegion = useCallback(
    (region: OrbitRegion) => {
      const globe = globeRef.current;
      if (!globe) return;

      const altitudeKm = regionAltitudes[region];
      if (!altitudeKm) return;

      // (1 + visual altitude) * 2 frames the region shell.
      const distanceInGlobeRadii = 2 * (1 + altitudeToGlobeUnits(altitudeKm));

      globe.pointOfView(
        { lat: 0, lng: 0, altitude: distanceInGlobeRadii },
        2000,
      );
    },
    [globeRef],
  );

  return { flyToRegion };
}
