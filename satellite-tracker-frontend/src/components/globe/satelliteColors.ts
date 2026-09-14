import type { Satellite, SatelliteGroup, OrbitRegion } from "../../api";

const groupColors: Partial<Record<SatelliteGroup, string>> = {
  STARLINK: "#00ffff",
  ONEWEB: "#ff00ff",
  ISS: "#ffffff",
  GPS: "#ffa500",
  WEATHER: "#00ffcc",
  IRIDIUM: "#00ff00",
  DEBRIS: "#ff6600",
  OTHER: "#8888ff",
};

const orbitColors: Record<OrbitRegion, string> = {
  VLEO: "#00ffff",
  LEO: "#00ff00",
  MEO: "#800080",
  GEO: "#ffff00",
  HEO: "#ff0000",
  UNKNOWN: "#808080",
};

export function getSatelliteColor(satellite: Satellite): string {
  return (
    groupColors[satellite.group] ??
    orbitColors[satellite.orbit?.region ?? "UNKNOWN"]
  );
}

export function getTrailColor(satellite: Satellite): string {
  const [r, g, b] = parseHex(getSatelliteColor(satellite));
  return `rgba(${r}, ${g}, ${b}, 0.18)`;
}

export function getSelectedColor(satellite: Satellite): string {
  const [r, g, b] = parseHex(getSatelliteColor(satellite));
  const factor = 1.8;
  return `rgb(${Math.min(255, Math.round(r * factor))}, ${Math.min(
    255,
    Math.round(g * factor),
  )}, ${Math.min(255, Math.round(b * factor))})`;
}

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}
