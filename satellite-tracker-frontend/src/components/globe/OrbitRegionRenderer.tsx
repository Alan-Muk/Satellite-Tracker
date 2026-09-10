import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

import { VISUAL_ALTITUDE_SCALE } from "./rendering";

import type { OrbitRegion } from "../../api";

export interface Region {
  name: OrbitRegion;

  altitudeKm: number;

  color: string;
}

export const regions: Region[] = [
  {
    name: "VLEO",
    altitudeKm: 150,
    color: "#00ffff",
  },

  {
    name: "LEO",
    altitudeKm: 800,
    color: "#00aaff",
  },

  {
    name: "MEO",
    altitudeKm: 10000,
    color: "#bb55ff",
  },

  {
    name: "GEO",
    altitudeKm: 35786,
    color: "#ffaa00",
  },

  {
    name: "HEO",
    altitudeKm: 20000,
    color: "#ff3366",
  },
];

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;

  selectedRegion: OrbitRegion | "ALL";
}

const EARTH_RADIUS_KM = 6378.137;

export default function OrbitRegionRenderer({
  globeRef,

  selectedRegion,
}: Props) {
  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

    const scene = globe.scene();

    const globeRadius = globe.getGlobeRadius();

    const shells: THREE.LineSegments[] = [];

    for (const region of regions) {
      const radius =
        globeRadius *
        (1 + (region.altitudeKm / EARTH_RADIUS_KM) * VISUAL_ALTITUDE_SCALE);

      const sphere = new THREE.SphereGeometry(radius, 64, 32);

      const geometry = new THREE.WireframeGeometry(sphere);

      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(region.color),

        transparent: true,

        opacity: selectedRegion === region.name ? 0.95 : 0.18,

        depthWrite: false,
      });

      const shell = new THREE.LineSegments(geometry, material);

      shell.name = `orbit-shell-${region.name}`;

      shell.userData.region = region.name;

      scene.add(shell);

      shells.push(shell);

      sphere.dispose();
    }

    return () => {
      for (const shell of shells) {
        scene.remove(shell);

        shell.geometry.dispose();

        const material = shell.material;

        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material.dispose();
        }
      }
    };
  }, [globeRef]);

  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

    const scene = globe.scene();

    for (const region of regions) {
      const shell = scene.getObjectByName(`orbit-shell-${region.name}`) as
        THREE.LineSegments | undefined;

      if (!shell) {
        continue;
      }

      const material = shell.material as THREE.LineBasicMaterial;

      material.opacity = selectedRegion === region.name ? 0.95 : 0.18;
    }
  }, [globeRef, selectedRegion]);

  return null;
}
