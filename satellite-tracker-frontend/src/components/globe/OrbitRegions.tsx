import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";

import type { OrbitRegion } from "../../api";

import { useOrbitCamera } from "../../hooks/useOrbitCamera";

import OrbitRegionRenderer from "./OrbitRegionRenderer";
import { createOrbitRegionPicker } from "./OrbitRegionPicker";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;

  selectedRegion: OrbitRegion | "ALL";

  onSelectRegion: (region: OrbitRegion | "ALL") => void;
}

export default function OrbitRegions({
  globeRef,
  selectedRegion,
  onSelectRegion,
}: Props) {
  const { flyToRegion } = useOrbitCamera({
    globeRef,
  });

  //
  // Move the camera when a specific
  // orbit region is selected.
  //
  useEffect(() => {
    if (selectedRegion === "ALL") {
      return;
    }

    flyToRegion(selectedRegion);
  }, [selectedRegion, flyToRegion]);

  //
  // Install region picking.
  //
  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

    const canvas = globe.renderer().domElement;

    const cleanup = createOrbitRegionPicker({
      scene: globe.scene(),
      camera: globe.camera(),
      canvas,
      onSelect: onSelectRegion,
    });

    return cleanup;
  }, [globeRef, onSelectRegion]);

  return (
    <OrbitRegionRenderer globeRef={globeRef} selectedRegion={selectedRegion} />
  );
}
