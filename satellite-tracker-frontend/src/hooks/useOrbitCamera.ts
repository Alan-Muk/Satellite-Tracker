import { useCallback } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";

import { VISUAL_ALTITUDE_SCALE } from "../components/globe/rendering";

import type { OrbitRegion } from "../api";

const EARTH_RADIUS_KM = 6378.137;

const regionAltitudes: Record<OrbitRegion, number> = {
  VLEO: 150,
  LEO: 800,
  MEO: 10000,
  GEO: 35786,
  HEO: 20000,
  UNKNOWN: 0,
};

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;
}

export function useOrbitCamera({ globeRef }: Props) {
  const flyToRegion = useCallback(
    (region: OrbitRegion) => {
      const globe = globeRef.current;

      if (!globe) {
        return;
      }

      const altitudeKm = regionAltitudes[region];

      if (!altitudeKm) {
        return;
      }

      //
      // Match the old Cesium camera distance:
      //
      // (Earth radius + region altitude * visual scale) * 2
      //
      const distanceInGlobeRadii =
        2 * (1 + (altitudeKm / EARTH_RADIUS_KM) * VISUAL_ALTITUDE_SCALE);

      globe.pointOfView(
        {
          lat: 0,
          lng: 0,
          altitude: distanceInGlobeRadii,
        },
        2000,
      );
    },
    [globeRef],
  );

  return {
    flyToRegion,
  };
}
