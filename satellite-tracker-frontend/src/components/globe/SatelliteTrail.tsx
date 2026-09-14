import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

import type { Satellite } from "../../api";
import { altitudeToGlobeUnits } from "./rendering";

import {
  getTrailPoints,
  syncTrails,
  trails,
  fullOrbitTrails,
  type TrailBuffer,
} from "./satelliteTrails";

import { getTrailColor } from "./satelliteColors";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;
  satelliteData: Satellite[];
}

interface TrailRenderer {
  line: THREE.Line;
  geometry: THREE.BufferGeometry;
  positionAttribute: THREE.BufferAttribute;
  material: THREE.LineBasicMaterial;
  capacity: number;
}

const UPDATE_INTERVAL_MS = 200;

function disposeTrailRenderer(renderer: TrailRenderer) {
  renderer.geometry.dispose();
  renderer.material.dispose();
}

function createTrailRenderer(
  satellite: Satellite | undefined,
  capacity: number,
  fullOrbit: boolean,
): TrailRenderer {
  const positions = new Float32Array(capacity * 3);
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute("position", positionAttribute);
  geometry.setDrawRange(0, 0);

  const material = new THREE.LineBasicMaterial({
    color: satellite ? getTrailColor(satellite) : "#668899",
    transparent: true,
    opacity: fullOrbit ? 0.65 : 0.45,
    depthWrite: false,
    depthTest: true,
  });

  const line = new THREE.Line(geometry, material);
  line.frustumCulled = false;
  line.renderOrder = 50;

  return { line, geometry, positionAttribute, material, capacity };
}

function updateTrailRenderer(
  globe: GlobeMethods,
  renderer: TrailRenderer,
  trail: TrailBuffer,
) {
  const points = getTrailPoints(trail);
  const count = Math.min(points.length, renderer.capacity);
  const positions = renderer.positionAttribute.array as Float32Array;

  for (let i = 0; i < count; i++) {
    const point = points[i];
    const coords = globe.getCoords(
      point.latitude,
      point.longitude,
      altitudeToGlobeUnits(point.altitude_km),
    );
    const offset = i * 3;
    positions[offset] = coords.x;
    positions[offset + 1] = coords.y;
    positions[offset + 2] = coords.z;
  }

  renderer.positionAttribute.needsUpdate = true;
  renderer.geometry.setDrawRange(0, count);
}

export default function SatelliteTrail({ globeRef, satelliteData }: Props) {
  const renderersRef = useRef<Map<number, TrailRenderer>>(new Map());
  const groupRef = useRef<THREE.Group | null>(null);

  const metadataRef = useRef<Map<number, Satellite>>(new Map());
  metadataRef.current = useMemo(
    () => new Map(satelliteData.map((s) => [s.norad_id, s])),
    [satelliteData],
  );

  const satelliteIdKey = useMemo(
    () => satelliteData.map((s) => s.norad_id).join(","),
    [satelliteData],
  );

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const scene = globe.scene();
    const trailGroup = new THREE.Group();
    trailGroup.name = "satellite-trails";
    scene.add(trailGroup);
    groupRef.current = trailGroup;

    const activeNoradIds = satelliteIdKey
      ? satelliteIdKey.split(",").map(Number)
      : [];
    const activeSet = new Set(activeNoradIds);

    const ensureRenderer = (noradId: number, trail: TrailBuffer) => {
      const existing = renderersRef.current.get(noradId);
      const fullOrbit = fullOrbitTrails.has(noradId);

      if (existing && existing.capacity >= trail.capacity) {
        existing.material.opacity = fullOrbit ? 0.65 : 0.45;
        return existing;
      }

      if (existing) {
        trailGroup.remove(existing.line);
        disposeTrailRenderer(existing);
        renderersRef.current.delete(noradId);
      }

      const renderer = createTrailRenderer(
        metadataRef.current.get(noradId),
        trail.capacity,
        fullOrbit,
      );
      renderer.line.name = `satellite-trail-${noradId}`;
      trailGroup.add(renderer.line);
      renderersRef.current.set(noradId, renderer);
      return renderer;
    };

    const updateTrails = () => {
      syncTrails(activeNoradIds);

      trails.forEach((trail, noradId) => {
        if (trail.size < 2) return;
        const renderer = ensureRenderer(noradId, trail);
        updateTrailRenderer(globe, renderer, trail);
      });

      for (const [noradId, renderer] of renderersRef.current) {
        if (!trails.has(noradId) || !activeSet.has(noradId)) {
          trailGroup.remove(renderer.line);
          disposeTrailRenderer(renderer);
          renderersRef.current.delete(noradId);
        }
      }
    };

    updateTrails();
    const interval = window.setInterval(updateTrails, UPDATE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      for (const renderer of renderersRef.current.values()) {
        trailGroup.remove(renderer.line);
        disposeTrailRenderer(renderer);
      }
      renderersRef.current.clear();
      scene.remove(trailGroup);
      groupRef.current = null;
    };
  }, [globeRef, satelliteIdKey]);

  return null;
}
