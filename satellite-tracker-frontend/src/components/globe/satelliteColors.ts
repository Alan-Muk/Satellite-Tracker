import type { Satellite } from "../../api";

//
// Constellation colours
//

const groupColors: Record<string, string> = {
  ISS: "#ffffff",

  STARLINK: "#00ffff",

  GPS: "#ffa500",

  ONEWEB: "#ff00ff",

  IRIDIUM: "#00ff00",

  NOAA: "#00ffff",

  GALILEO: "#0000ff",

  LANDSAT: "#00ff00",
};

//
// Orbit colours
//

const orbitColors: Record<string, string> = {
  VLEO: "#00ffff",

  LEO: "#00ff00",

  MEO: "#800080",

  GEO: "#ffff00",

  HEO: "#ff0000",

  UNKNOWN: "#808080",
};

function normalize(value?: string): string {
  return value?.toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
}

function findGroupColor(group?: string): string | undefined {
  const normalized = normalize(group);

  for (const key of Object.keys(groupColors)) {
    if (normalized.includes(key)) {
      return groupColors[key];
    }
  }

  return undefined;
}

export function getSatelliteColor(satellite: Satellite): string {
  const constellationColor = findGroupColor(satellite.group);

  if (constellationColor) {
    return constellationColor;
  }

  const region = satellite.orbit?.region ?? "UNKNOWN";

  return orbitColors[region] ?? orbitColors.UNKNOWN;
}

export function getTrailColor(satellite: Satellite): string {
  return toRgba(getSatelliteColor(satellite), 0.18);
}

export function getSelectedColor(satellite: Satellite): string {
  return brightenColor(getSatelliteColor(satellite), 0.8);
}

function toRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");

  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function brightenColor(hex: string, amount: number): string {
  const value = hex.replace("#", "");

  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  const factor = 1 + amount;

  const brightenedRed = Math.min(255, Math.round(red * factor));
  const brightenedGreen = Math.min(255, Math.round(green * factor));
  const brightenedBlue = Math.min(255, Math.round(blue * factor));

  return `rgb(${brightenedRed}, ${brightenedGreen}, ${brightenedBlue})`;
}
