import type { Satellite, SatellitePosition } from "../api";

interface Props {
  satellite: Satellite;

  position: SatellitePosition;

  onClose: () => void;
}

export default function TrackerPanel({
  satellite,

  position,

  onClose,
}: Props) {
  return (
    <aside className="overlay telemetry-panel">
      <button
        className="close-button"

        onClick={onClose}
      >
        ×
      </button>

      <div className="telemetry">
        <h2>{satellite.name}</h2>

        <div>NORAD: {satellite.norad_id}</div>

        <div>Group: {satellite.group}</div>

        <div>Orbit: {satellite.orbit?.region ?? "UNKNOWN"}</div>

        {satellite.orbit && (
          <>
            <div>
              Inclination: {satellite.orbit.inclination_deg.toFixed(1)}°
            </div>

            <div>
              Period: {satellite.orbit.period_minutes.toFixed(1)}
              min
            </div>
          </>
        )}

        <div>Latitude: {position.latitude.toFixed(2)}°</div>

        <div>Longitude: {position.longitude.toFixed(2)}°</div>

        <div>
          Altitude: {position.altitude_km.toFixed(0)}
          km
        </div>

        <div>
          Velocity: {position.velocity_km_s.toFixed(2)}
          km/s
        </div>
      </div>
    </aside>
  );
}
