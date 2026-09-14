import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

import { altitudeToGlobeUnits } from "./rendering";
import { regions } from "./orbitRegions";

import type { OrbitRegion } from "../../api";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;
  selectedRegion: OrbitRegion | "ALL";
}

function getShellOpacity(
  region: OrbitRegion,
  selectedRegion: OrbitRegion | "ALL",
) {
  return selectedRegion === region ? 0.95 : 0.18;
}

export default function OrbitRegionRenderer({
  globeRef,
  selectedRegion,
}: Props) {
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

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
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globeRef]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const scene = globe.scene();

    for (const region of regions) {
      const shell = scene.getObjectByName(`orbit-shell-${region.name}`) as
        THREE.LineSegments | undefined;
      if (!shell) continue;

      const material = shell.material as THREE.LineBasicMaterial;
      material.opacity = getShellOpacity(region.name, selectedRegion);
    }
  }, [globeRef, selectedRegion]);

  return null;
}
