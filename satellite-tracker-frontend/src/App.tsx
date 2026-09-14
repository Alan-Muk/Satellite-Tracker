import { useState } from "react";

import { useActiveSatellitePrediction } from "./hooks/useActiveSatellitePrediction";
import { useSatelliteData } from "./hooks/useSatelliteData";
import { useSatelliteFilters } from "./hooks/useSatelliteFilters";
import { useSatelliteGroups } from "./hooks/useSatelliteGroups";
import { useSatelliteOrbits } from "./hooks/useSatelliteOrbits";
import { useSatellitePositions } from "./hooks/useSatellitePositions";

import ControlPanel from "./components/ControlPanel";
import GlobeView from "./components/GlobeView";

function App() {
  const { satellites } = useSatelliteData();

  const {
    selectedGroup,
    setSelectedGroup,
    selectedRegion,
    setSelectedRegion,
    highlightedIds,
  } = useSatelliteFilters({ satellites });

  const [selectedNorad, setSelectedNorad] = useState<number | null>(null);

  const { visiblePositions, position } = useSatellitePositions({
    satellites,
    selectedNorad,
  });

  useActiveSatellitePrediction(selectedNorad);

  const groups = useSatelliteGroups();
  const orbits = useSatelliteOrbits();

  const selectedSatellite =
    satellites.find((satellite) => satellite.norad_id === selectedNorad) ??
    null;

  return (
    <div className="app">
      <main className="map">
        <GlobeView
          position={position}
          satellites={visiblePositions}
          satelliteData={satellites}
          highlightedIds={highlightedIds}
          selectedNorad={selectedNorad}
          selectedRegion={selectedRegion}
          onSelect={setSelectedNorad}
          onRegionSelect={setSelectedRegion}
        />
      </main>

      <ControlPanel
        satelliteCount={satellites.length}
        groups={groups}
        orbits={orbits}
        selectedGroup={selectedGroup}
        selectedRegion={selectedRegion}
        onGroupChange={setSelectedGroup}
        onRegionChange={setSelectedRegion}
        selectedSatellite={selectedSatellite}
        selectedPosition={position}
        onClearSelection={() => setSelectedNorad(null)}
      />
    </div>
  );
}

export default App;
