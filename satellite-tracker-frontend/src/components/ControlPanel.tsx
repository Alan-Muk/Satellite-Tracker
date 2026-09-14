import { useState } from "react";

import type {
  OrbitRegion,
  Satellite,
  SatelliteGroup,
  SatelliteGroups,
  SatelliteOrbits,
  SatellitePosition,
} from "../api";
import { regions as regionDefs } from "./globe/orbitRegions";

interface Props {
  satelliteCount: number;
  groups: SatelliteGroups;
  orbits: SatelliteOrbits;
  selectedGroup: SatelliteGroup | "ALL";
  selectedRegion: OrbitRegion | "ALL";
  onGroupChange: (group: SatelliteGroup | "ALL") => void;
  onRegionChange: (region: OrbitRegion | "ALL") => void;
  selectedSatellite: Satellite | null;
  selectedPosition: SatellitePosition | null;
  onClearSelection: () => void;
}

const fmt = (value: number | undefined | null, digits: number, suffix = "") =>
  typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(digits)}${suffix}`
    : "—";

export default function ControlPanel({
  satelliteCount,
  groups,
  orbits,
  selectedGroup,
  selectedRegion,
  onGroupChange,
  onRegionChange,
  selectedSatellite,
  selectedPosition,
  onClearSelection,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const groupEntries = Object.entries(groups) as [SatelliteGroup, number][];
  groupEntries.sort((a, b) => b[1] - a[1]);

  return (
    <aside className={`overlay control-panel${collapsed ? " collapsed" : ""}`}>
      <header className="control-panel-header">
        <h1>Satellite Tracker</h1>
        <button
          className="collapse-button"
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand panel" : "Collapse panel"}
        >
          {collapsed ? "+" : "−"}
        </button>
      </header>

      {!collapsed && (
        <div className="control-panel-body">
          <section className="panel-section">
            <h2>Groups</h2>
            <button
              type="button"
              className={`filter-pill${selectedGroup === "ALL" ? " active" : ""}`}
              onClick={() => onGroupChange("ALL")}
            >
              All
            </button>
            {groupEntries.map(([group, count]) => (
              <button
                key={group}
                type="button"
                className={`filter-pill${selectedGroup === group ? " active" : ""}`}
                onClick={() => onGroupChange(group)}
              >
                {group} <span className="count">{count}</span>
              </button>
            ))}
          </section>

          <section className="panel-section">
            <h2>Regions</h2>
            <button
              type="button"
              className={`filter-pill${selectedRegion === "ALL" ? " active" : ""}`}
              onClick={() => onRegionChange("ALL")}
            >
              All
            </button>
            {regionDefs.map((region) => {
              const count = orbits[region.name] ?? 0;
              return (
                <button
                  key={region.name}
                  type="button"
                  className={`filter-pill${selectedRegion === region.name ? " active" : ""}`}
                  onClick={() => onRegionChange(region.name)}
                >
                  <span
                    className="swatch"
                    style={{ backgroundColor: region.color }}
                  />
                  {region.name} <span className="count">{count}</span>
                </button>
              );
            })}
          </section>

          <section className="panel-section">
            <h2>Selected</h2>
            {selectedSatellite ? (
              <>
                <div className="selected-header">
                  <strong>{selectedSatellite.name}</strong>
                  <button
                    className="clear-button"
                    type="button"
                    onClick={onClearSelection}
                    aria-label="Clear selection"
                  >
                    ×
                  </button>
                </div>
                <dl className="telemetry">
                  <div>
                    <dt>NORAD</dt>
                    <dd>{selectedSatellite.norad_id}</dd>
                  </div>
                  <div>
                    <dt>Group</dt>
                    <dd>{selectedSatellite.group}</dd>
                  </div>
                  <div>
                    <dt>Region</dt>
                    <dd>{selectedSatellite.orbit?.region ?? "—"}</dd>
                  </div>
                  {selectedSatellite.orbit && (
                    <>
                      <div>
                        <dt>Altitude</dt>
                        <dd>
                          {fmt(selectedSatellite.orbit.altitude_km, 0, " km")}
                        </dd>
                      </div>
                      <div>
                        <dt>Inclination</dt>
                        <dd>
                          {fmt(selectedSatellite.orbit.inclination_deg, 1, "°")}
                        </dd>
                      </div>
                      <div>
                        <dt>Period</dt>
                        <dd>
                          {fmt(
                            selectedSatellite.orbit.period_minutes,
                            1,
                            " min",
                          )}
                        </dd>
                      </div>
                    </>
                  )}
                  {selectedPosition && (
                    <>
                      <div>
                        <dt>Latitude</dt>
                        <dd>{fmt(selectedPosition.latitude, 2, "°")}</dd>
                      </div>
                      <div>
                        <dt>Longitude</dt>
                        <dd>{fmt(selectedPosition.longitude, 2, "°")}</dd>
                      </div>
                      <div>
                        <dt>Altitude</dt>
                        <dd>{fmt(selectedPosition.altitude_km, 0, " km")}</dd>
                      </div>
                      <div>
                        <dt>Velocity</dt>
                        <dd>
                          {fmt(selectedPosition.velocity_km_s, 2, " km/s")}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </>
            ) : (
              <p className="muted">Click a satellite to select it.</p>
            )}
          </section>

          <footer className="panel-footer">
            {satelliteCount} satellites loaded
          </footer>
        </div>
      )}
    </aside>
  );
}
