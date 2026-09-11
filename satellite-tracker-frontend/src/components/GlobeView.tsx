import { memo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";

import type { OrbitRegion, Satellite, SatellitePosition } from "../api";

import GlobeLayers from "./globe/GlobeLayers";

interface Props {
  position: SatellitePosition | null;

  satellites: SatellitePosition[];

  satelliteData: Satellite[];

  highlightedIds: number[];

  selectedNorad: number | null;

  selectedRegion: OrbitRegion | "ALL";

  onSelect: (noradId: number) => void;

  onRegionSelect: (region: OrbitRegion | "ALL") => void;
}

function GlobeView({
  position,
  satellites,
  satelliteData,
  highlightedIds,
  selectedNorad,
  selectedRegion,
  onSelect,
  onRegionSelect,
}: Props) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  const [globeReady, setGlobeReady] = useState(false);

  return (
    <>
      <Globe
        ref={globeRef}
        width={window.innerWidth}
        height={window.innerHeight}
        backgroundColor="#02040a"
        showAtmosphere
        atmosphereColor="#4da6ff"
        atmosphereAltitude={0.15}
        animateIn={false}
        enablePointerInteraction={false}
        onGlobeReady={() => {
          setGlobeReady(true);
        }}
      />

      {globeReady && (
        <GlobeLayers
          globeRef={globeRef}
          position={position}
          satellites={satellites}
          satelliteData={satelliteData}
          highlightedIds={highlightedIds}
          selectedNorad={selectedNorad}
          selectedRegion={selectedRegion}
          onSelect={onSelect}
          onRegionSelect={onRegionSelect}
        />
      )}
    </>
  );
}

export default memo(GlobeView);
