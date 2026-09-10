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

interface GlobeSatellitePoint {
  norad_id: number;
  name: string;
  lat: number;
  lng: number;
  altitude: number;
  color: string;
  size: number;
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

  const [satellitePoints] = useState<GlobeSatellitePoint[]>([]);

  return (
    <>
      <Globe
        ref={globeRef}
        width={window.innerWidth}
        height={window.innerHeight}
        backgroundColor="#000000"
        showAtmosphere
        atmosphereColor="#4da6ff"
        atmosphereAltitude={0.15}
        animateIn={false}
        enablePointerInteraction

        pointsData={satellitePoints}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="altitude"
        pointColor="color"
        pointRadius={(point) => (point as GlobeSatellitePoint).size}
        pointLabel={(point) => (point as GlobeSatellitePoint).name}
        onPointClick={(point) => {
          onSelect((point as GlobeSatellitePoint).norad_id);
        }}
      />

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
    </>
  );
}

export default memo(GlobeView);
