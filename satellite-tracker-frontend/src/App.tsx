import { useState } from "react";

import { useActiveSatellitePrediction } from "./hooks/useActiveSatellitePrediction";
import { useSatelliteData } from "./hooks/useSatelliteData";
import { useSatelliteFilters } from "./hooks/useSatelliteFilters";
import { useSatellitePositions } from "./hooks/useSatellitePositions";

import GlobeView from "./components/GlobeView";
import TrackerPanel from "./components/TrackerPanel";

function App() {
  const { satellites } = useSatelliteData();

  const { selectedRegion, setSelectedRegion, highlightedIds } =
    useSatelliteFilters({
      satellites,
    });

  const [selectedNorad, setSelectedNorad] = useState<number | null>(null);

  const { visiblePositions, position } = useSatellitePositions({
    satellites,
    selectedNorad,
  });

  useActiveSatellitePrediction(selectedNorad);

  const selectedSatellite = satellites.find(
    (satellite) => satellite.norad_id === selectedNorad,
  );

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

      {selectedSatellite && position && (
        <TrackerPanel
          satellite={selectedSatellite}
          position={position}
          onClose={() => setSelectedNorad(null)}
        />
      )}
    </div>
  );
}

export default App;
