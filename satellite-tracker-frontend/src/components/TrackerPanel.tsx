import type { Satellite, SatellitePosition } from "../api";

interface Props {
  satellite: Satellite;

  position: SatellitePosition;

  onClose: () => void;
}

export default function TrackerPanel({ satellite, position, onClose }: Props) {
  return (
    <aside className="overlay telemetry-panel">
      <button
        className="close-button"
        type="button"
        onClick={onClose}
        aria-label="Close tracker panel"
      >
        ×
      </button>

      <div className="telemetry">
        <h2>{satellite.name}</h2>

        <dl>
          <div>
            <dt>NORAD</dt>
            <dd>{satellite.norad_id}</dd>
          </div>

          <div>
            <dt>Group</dt>
            <dd>{satellite.group}</dd>
          </div>

          <div>
            <dt>Orbit</dt>
            <dd>{satellite.orbit?.region ?? "UNKNOWN"}</dd>
          </div>

          {satellite.orbit && (
            <>
              <div>
                <dt>Inclination</dt>
                <dd>{satellite.orbit.inclination_deg.toFixed(1)}°</dd>
              </div>

              <div>
                <dt>Period</dt>
                <dd>{satellite.orbit.period_minutes.toFixed(1)} min</dd>
              </div>
            </>
          )}

          <div>
            <dt>Latitude</dt>
            <dd>{position.latitude.toFixed(2)}°</dd>
          </div>

          <div>
            <dt>Longitude</dt>
            <dd>{position.longitude.toFixed(2)}°</dd>
          </div>

          <div>
            <dt>Altitude</dt>
            <dd>{position.altitude_km.toFixed(0)} km</dd>
          </div>

          <div>
            <dt>Velocity</dt>
            <dd>{position.velocity_km_s.toFixed(2)} km/s</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
