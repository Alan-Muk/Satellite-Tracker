import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

import type { Satellite, SatellitePosition } from "../../api";
import { getPrediction as fetchPrediction } from "../../api";

import {
  type AnimatedSatellite,
  type AnimatedSatellitePosition,
  SatelliteAnimator,
  elapsedSincePrediction,
} from "./SatelliteAnimator";

import {
  getPrediction as getStoredPrediction,
  setPrediction,
  subscribePrediction,
} from "./predictionStore";

import {
  pushTrail,
  syncTrails,
  assignFullOrbitSatellites,
} from "./satelliteTrails";

import { getSatelliteColor } from "./satelliteColors";
import { altitudeToGlobeUnits } from "./rendering";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;
  satellites: SatellitePosition[];
  satelliteData: Satellite[];
  highlightedIds: number[];
  selectedNorad: number | null;
  onSelect: (noradId: number) => void;
}

const POINT_SIZE = 8;
const HIGHLIGHT_SIZE = 11;
const SELECTED_SIZE = 16;

function createSatelliteMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    vertexShader: `
      attribute float pointSize;
      varying vec3 vColor;

      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = pointSize * (300.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 coordinate = gl_PointCoord - vec2(0.5);
        float distance = length(coordinate);
        if (distance > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.35, 0.5, distance);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  });
}

function toAnimatedPosition(
  position: SatellitePosition,
): AnimatedSatellitePosition {
  return {
    latitude: position.latitude,
    longitude: position.longitude,
    altitude_km: position.altitude_km,
  };
}

function createStaticSatellite(position: SatellitePosition): AnimatedSatellite {
  const animatedPosition = toAnimatedPosition(position);
  return {
    norad_id: position.norad_id,
    prediction: [animatedPosition, animatedPosition],
    step_seconds: 1,
    elapsed_seconds: 0,
  };
}

export default function SatellitePoints({
  globeRef,
  satellites,
  satelliteData,
  highlightedIds,
  selectedNorad,
  onSelect,
}: Props) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const animatedSatellites = useRef<AnimatedSatellite[]>([]);
  const positionsRef = useRef<Map<number, AnimatedSatellitePosition>>(
    new Map(),
  );
  const noradIdsRef = useRef<number[]>([]);

  // Stable key for the displayed set (avoids effects keying on array identity).
  const satelliteIdKey = useMemo(
    () => satellites.map((s) => s.norad_id).join(","),
    [satellites],
  );

  /* ---- Fetch predictions once per displayed satellite ---- */
  useEffect(() => {
    if (satelliteIdKey === "") return;
    let cancelled = false;

    async function loadPredictions() {
      await Promise.all(
        satellites.map(async (satellite) => {
          if (getStoredPrediction(satellite.norad_id)) return;
          try {
            const prediction = await fetchPrediction(satellite.norad_id);
            if (!cancelled) setPrediction(prediction);
          } catch (error) {
            if (!cancelled) {
              console.error(
                `Failed to load prediction for ${satellite.norad_id}`,
                error,
              );
            }
          }
        }),
      );
    }

    loadPredictions().catch((error) => {
      if (!cancelled)
        console.error("Failed to load satellite predictions", error);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satelliteIdKey]);

  /* ---- Create the THREE.Points once ---- */
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const scene = globe.scene();
    const geometry = new THREE.BufferGeometry();
    const material = createSatelliteMaterial();
    const points = new THREE.Points(geometry, material);

    points.name = "satellite-points";
    points.frustumCulled = false;
    points.renderOrder = 100;

    scene.add(points);
    pointsRef.current = points;
    geometryRef.current = geometry;

    return () => {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
      pointsRef.current = null;
      geometryRef.current = null;
    };
  }, [globeRef]);

  /* ---- (Re)build display geometry — depends on IDs/highlight/selection only ---- */
  useEffect(() => {
    const globe = globeRef.current;
    const points = pointsRef.current;
    if (!globe || !points) return;

    const metadataMap = new Map(satelliteData.map((s) => [s.norad_id, s]));
    const activeIds = satellites.map((s) => s.norad_id);
    const activeIdSet = new Set(activeIds);
    const highlightSet = new Set(highlightedIds);

    syncTrails(activeIds);
    assignFullOrbitSatellites(
      satelliteData.filter((s) => activeIdSet.has(s.norad_id)),
    );

    const nextAnimated: AnimatedSatellite[] = [];
    const positions = new Float32Array(satellites.length * 3);
    const colors = new Float32Array(satellites.length * 3);
    const sizes = new Float32Array(satellites.length);

    noradIdsRef.current = activeIds;
    positionsRef.current.clear();

    satellites.forEach((satellite, index) => {
      const storedPrediction = getStoredPrediction(satellite.norad_id);

      const animated =
        storedPrediction && storedPrediction.points.length >= 2
          ? {
              norad_id: satellite.norad_id,
              prediction: storedPrediction.points,
              step_seconds: storedPrediction.step_seconds,
              elapsed_seconds: elapsedSincePrediction(
                storedPrediction.generated_at,
                storedPrediction.step_seconds,
                storedPrediction.points.length,
              ),
            }
          : createStaticSatellite(satellite);

      nextAnimated.push(animated);

      const currentPosition = toAnimatedPosition(satellite);
      positionsRef.current.set(satellite.norad_id, currentPosition);

      const coords = globe.getCoords(
        satellite.latitude,
        satellite.longitude,
        altitudeToGlobeUnits(satellite.altitude_km),
      );
      const offset = index * 3;
      positions[offset] = coords.x;
      positions[offset + 1] = coords.y;
      positions[offset + 2] = coords.z;

      const fallbackSatellite: Satellite = {
        ...(metadataMap.get(satellite.norad_id) ?? {
          norad_id: satellite.norad_id,
          name: "Unknown",
          group: "UNKNOWN",
        }),
      } as Satellite;

      const color = new THREE.Color(getSatelliteColor(fallbackSatellite));
      const isHighlighted = highlightSet.has(satellite.norad_id);
      const isSelected = satellite.norad_id === selectedNorad;

      if (isSelected) {
        color.multiplyScalar(1.5);
        sizes[index] = SELECTED_SIZE;
      } else if (isHighlighted) {
        sizes[index] = HIGHLIGHT_SIZE;
      } else {
        sizes[index] = POINT_SIZE;
      }

      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;

      pushTrail(satellite.norad_id, currentPosition);
    });

    animatedSatellites.current = nextAnimated;

    const oldGeometry = geometryRef.current;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("pointSize", new THREE.BufferAttribute(sizes, 1));
    geometry.computeBoundingSphere();
    points.geometry = geometry;
    geometryRef.current = geometry;

    if (oldGeometry && oldGeometry !== geometry) oldGeometry.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globeRef, satelliteIdKey, satelliteData, highlightedIds, selectedNorad]);

  /*
   * Re-seed the animator when predictions arrive or are replaced,
   * without touching geometry. This keeps a fresh prediction from
   * forcing a full rebuild of colors/sizes/positions.
   */
  useEffect(() => {
    return subscribePrediction(() => {
      const current = animatedSatellites.current;
      if (current.length === 0) return;

      for (const animated of current) {
        const stored = getStoredPrediction(animated.norad_id);
        if (!stored || stored.points.length < 2) continue;

        // Only re-seed if the prediction object actually changed.
        if (animated.prediction === stored.points) continue;

        animated.prediction = stored.points;
        animated.step_seconds = stored.step_seconds;
        animated.elapsed_seconds = elapsedSincePrediction(
          stored.generated_at,
          stored.step_seconds,
          stored.points.length,
        );
      }
    });
  }, []);

  /* ---- Animation loop ---- */
  useEffect(() => {
    const globe = globeRef.current;
    const points = pointsRef.current;
    if (!globe || !points) return;

    const animator = new SatelliteAnimator((noradId, position) => {
      positionsRef.current.set(noradId, position);
    });

    let lastTime = performance.now();
    let trailAccumulator = 0;
    let frame = 0;

    const TRAIL_INTERVAL = 0.2;

    const tick = (now: number) => {
      const deltaSeconds = Math.min((now - lastTime) / 1000, 1);
      lastTime = now;

      animator.update(animatedSatellites.current, deltaSeconds);

      trailAccumulator += deltaSeconds;
      if (trailAccumulator >= TRAIL_INTERVAL) {
        trailAccumulator -= TRAIL_INTERVAL;
        for (const animated of animatedSatellites.current) {
          const position = positionsRef.current.get(animated.norad_id);
          if (position) pushTrail(animated.norad_id, position);
        }
      }

      const positionAttribute = points.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const positionArray = positionAttribute.array as Float32Array;

      satellites.forEach((satellite, index) => {
        const position = positionsRef.current.get(satellite.norad_id);
        if (!position) return;

        const coords = globe.getCoords(
          position.latitude,
          position.longitude,
          altitudeToGlobeUnits(position.altitude_km),
        );
        const offset = index * 3;
        positionArray[offset] = coords.x;
        positionArray[offset + 1] = coords.y;
        positionArray[offset + 2] = coords.z;
      });

      positionAttribute.needsUpdate = true;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globeRef, satelliteIdKey]);

  /* ---- Selection raycaster ---- */
  useEffect(() => {
    const globe = globeRef.current;
    const points = pointsRef.current;
    if (!globe || !points) return;

    const canvas = globe.renderer().domElement;
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 1.8;
    const mouse = new THREE.Vector2();

    let downX = 0;
    let downY = 0;

    const onDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
    };

    const onUp = (event: PointerEvent) => {
      // Ignore drags (treated as globe rotation).
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 4) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, globe.camera());
      const intersections = raycaster.intersectObject(points, false);
      if (intersections.length === 0) return;

      const intersection = intersections[0];
      if (intersection.index == null) return;

      const noradId = noradIdsRef.current[intersection.index];
      if (noradId == null) return;

      onSelect(noradId);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, [globeRef, onSelect]);

  return null;
}
