import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

import { altitudeToGlobeUnits } from "./rendering";

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

function getShellOpacity(
  region: OrbitRegion,
  selectedRegion: OrbitRegion | "ALL",
) {
  if (selectedRegion === region) {
    return 0.95;
  }

  return 0.18;
}

export default function OrbitRegionRenderer({
  globeRef,
  selectedRegion,
}: Props) {
  //
  // Create orbit shells.
  //
  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

    const scene = globe.scene();

    const shells: THREE.LineSegments[] = [];

    for (const region of regions) {
      const radius =
        globe.getGlobeRadius() * (1 + altitudeToGlobeUnits(region.altitudeKm));

      const sphere = new THREE.SphereGeometry(radius, 64, 32);

      const geometry = new THREE.WireframeGeometry(sphere);

      sphere.dispose();

      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(region.color),

        transparent: true,

        opacity: getShellOpacity(region.name, selectedRegion),

        depthWrite: false,

        depthTest: true,
      });

      const shell = new THREE.LineSegments(geometry, material);

      shell.name = `orbit-shell-${region.name}`;

      shell.userData.region = region.name;

      shell.renderOrder = 20;

      scene.add(shell);

      shells.push(shell);
    }

    return () => {
      for (const shell of shells) {
        scene.remove(shell);

        shell.geometry.dispose();

        const material = shell.material;

        if (Array.isArray(material)) {
          for (const item of material) {
            item.dispose();
          }
        } else {
          material.dispose();
        }
      }
    };
  }, [globeRef]);

  //
  // Update shell highlighting.
  //
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

      material.opacity = getShellOpacity(region.name, selectedRegion);
    }
  }, [globeRef, selectedRegion]);

  return null;
}
