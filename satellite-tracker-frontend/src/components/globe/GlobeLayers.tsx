import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";

import Earth from "./Earth";
import OrbitRegions from "./OrbitRegions";
import SatellitePoints from "./SatellitePoints";
import SatelliteTrail from "./SatelliteTrail";
import SelectedSatellite from "./SelectedSatellite";

import type { Satellite, SatellitePosition, OrbitRegion } from "../../api";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;

  position: SatellitePosition | null;

  satellites: SatellitePosition[];

  satelliteData: Satellite[];

  highlightedIds: number[];

  selectedNorad: number | null;

  selectedRegion: OrbitRegion | "ALL";

  onSelect: (noradId: number) => void;

  onRegionSelect: (region: OrbitRegion | "ALL") => void;
}

export default function GlobeLayers({
  globeRef,
  position,
  satellites,
  satelliteData,
  highlightedIds,
  selectedNorad,
  selectedRegion,
  onSelect,
  onRegionSelect,
}: Props) {
  return (
    <>
      <Earth globeRef={globeRef} />

      <OrbitRegions
        globeRef={globeRef}
        selectedRegion={selectedRegion}
        onSelectRegion={onRegionSelect}
      />

      <SatelliteTrail globeRef={globeRef} satelliteData={satelliteData} />

      <SatellitePoints
        globeRef={globeRef}
        satellites={satellites}
        satelliteData={satelliteData}
        highlightedIds={highlightedIds}
        selectedNorad={selectedNorad}
        onSelect={onSelect}
      />

      {selectedNorad !== null && position && (
        <SelectedSatellite globeRef={globeRef} position={position} />
      )}
    </>
  );
}
