import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

import type { Satellite } from "../../api";

import { trails, fullOrbitTrails } from "./satelliteTrails";
import { getTrailColor } from "./satelliteColors";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;
  satelliteData: Satellite[];
}

const EARTH_RADIUS_KM = 6378.137;

function altitudeToGlobeUnits(altitudeKm: number) {
  return altitudeKm / EARTH_RADIUS_KM;
}

export default function SatelliteTrail({ globeRef, satelliteData }: Props) {
  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

    const scene = globe.scene();

    const trailGroup = new THREE.Group();

    trailGroup.name = "satellite-trails";

    trailGroup.renderOrder = 50;

    scene.add(trailGroup);

    const metadataMap = new Map(
      satelliteData.map((satellite) => [satellite.norad_id, satellite]),
    );

    const rebuildTrails = () => {
      //
      // Remove old line objects.
      //
      while (trailGroup.children.length > 0) {
        const child = trailGroup.children[0];

        trailGroup.remove(child);

        if (child instanceof THREE.Line) {
          child.geometry.dispose();

          const material = child.material;

          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material.dispose();
          }
        }
      }

      //
      // Build current trails from the exact same
      // trail store used by SatellitePoints.
      //
      trails.forEach((points, noradId) => {
        if (points.length < 2) {
          return;
        }

        const satellite = metadataMap.get(noradId);

        const color = satellite ? getTrailColor(satellite) : "#668899";

        const fullOrbit = fullOrbitTrails.has(noradId);

        const visiblePoints = fullOrbit
          ? points
          : points.slice(Math.max(0, points.length - 40));

        if (visiblePoints.length < 2) {
          return;
        }

        const positions = new Float32Array(visiblePoints.length * 3);

        visiblePoints.forEach((point, index) => {
          const coords = globe.getCoords(
            point.latitude,
            point.longitude,
            altitudeToGlobeUnits(point.altitude_km),
          );

          const offset = index * 3;

          positions[offset] = coords.x;
          positions[offset + 1] = coords.y;
          positions[offset + 2] = coords.z;
        });

        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );

        const material = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: fullOrbit ? 0.65 : 0.45,
          depthWrite: false,
          depthTest: true,
        });

        const line = new THREE.Line(geometry, material);

        line.name = `satellite-trail-${noradId}`;

        line.renderOrder = 50;

        trailGroup.add(line);
      });
    };

    rebuildTrails();

    const interval = window.setInterval(rebuildTrails, 100);

    return () => {
      window.clearInterval(interval);

      while (trailGroup.children.length > 0) {
        const child = trailGroup.children[0];

        trailGroup.remove(child);

        if (child instanceof THREE.Line) {
          child.geometry.dispose();

          const material = child.material;

          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material.dispose();
          }
        }
      }

      scene.remove(trailGroup);
    };
  }, [globeRef, satelliteData]);

  return null;
}
