import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

import type { Satellite, SatellitePosition } from "../../api";

import {
  SatelliteAnimator,
  type AnimatedSatellite,
  type AnimatedSatellitePosition,
  createAnimatedSatellite,
} from "./SatelliteAnimator";

import {
  assignRandomOrbitTrails,
  pushTrail,
  syncTrails,
} from "./satelliteTrails";

import { getPrediction } from "./predictionStore";
import { getSatelliteColor } from "./satelliteColors";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;

  satellites: SatellitePosition[];

  satelliteData: Satellite[];

  highlightedIds: number[];

  selectedNorad: number | null;

  onSelect: (noradId: number) => void;
}

const POINT_SIZE = 8;

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

        if (distance > 0.5) {
          discard;
        }

        float alpha = 1.0 - smoothstep(0.35, 0.5, distance);

        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  });
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

  //
  // Create the THREE.Points object.
  //
  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

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

  //
  // Build satellite state and geometry.
  //
  useEffect(() => {
    const globe = globeRef.current;
    const points = pointsRef.current;

    if (!globe || !points) {
      return;
    }

    const metadataMap = new Map(
      satelliteData.map((satellite) => [satellite.norad_id, satellite]),
    );

    const activeIds = satellites.map((satellite) => satellite.norad_id);

    syncTrails(activeIds);

    assignRandomOrbitTrails(activeIds, 0.08);

    const nextAnimated: AnimatedSatellite[] = [];

    const positions = new Float32Array(satellites.length * 3);

    const colors = new Float32Array(satellites.length * 3);

    const sizes = new Float32Array(satellites.length);

    noradIdsRef.current = satellites.map((satellite) => satellite.norad_id);

    positionsRef.current.clear();

    satellites.forEach((satellite, index) => {
      const metadata = metadataMap.get(satellite.norad_id);

      const prediction = getPrediction(satellite.norad_id);

      const altitude = metadata?.orbit?.altitude_km ?? satellite.altitude_km;

      const animated: AnimatedSatellite = prediction
        ? {
            norad_id: satellite.norad_id,
            prediction: prediction.points,
            step_seconds: prediction.step_seconds,
            elapsed_seconds: Math.random() * 500,
          }
        : createAnimatedSatellite(satellite.norad_id, altitude, 20);

      nextAnimated.push(animated);

      const currentPosition: AnimatedSatellitePosition = {
        latitude: satellite.latitude,
        longitude: satellite.longitude,
        altitude_km: satellite.altitude_km,
      };

      positionsRef.current.set(satellite.norad_id, currentPosition);

      const coords = globe.getCoords(
        satellite.latitude,
        satellite.longitude,
        satellite.altitude_km / 6378.137,
      );

      const offset = index * 3;

      positions[offset] = coords.x;
      positions[offset + 1] = coords.y;
      positions[offset + 2] = coords.z;

      const fallbackSatellite = {
        ...satellite,
        name: "Unknown",
        group: "UNKNOWN",
      };

      const color = new THREE.Color(
        getSatelliteColor(metadata ?? fallbackSatellite),
      );

      const isHighlighted = highlightedIds.includes(satellite.norad_id);

      const isSelected = satellite.norad_id === selectedNorad;

      if (isSelected) {
        color.multiplyScalar(1.5);
        sizes[index] = 16;
      } else if (isHighlighted) {
        sizes[index] = 11;
      } else {
        sizes[index] = POINT_SIZE;
      }

      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;

      pushTrail(satellite.norad_id, {
        latitude: satellite.latitude,
        longitude: satellite.longitude,
        altitude_km: satellite.altitude_km,
      });
    });

    animatedSatellites.current = nextAnimated;

    geometryRef.current?.dispose();

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    geometry.setAttribute("pointSize", new THREE.BufferAttribute(sizes, 1));

    geometry.computeBoundingSphere();

    points.geometry = geometry;

    geometryRef.current = geometry;
  }, [globeRef, satellites, satelliteData, highlightedIds, selectedNorad]);

  //
  // Animation.
  //
  useEffect(() => {
    const globe = globeRef.current;
    const points = pointsRef.current;

    if (!globe || !points) {
      return;
    }

    const animator = new SatelliteAnimator((noradId, position) => {
      positionsRef.current.set(noradId, position);

      pushTrail(noradId, position);
    });

    let lastTime = performance.now();

    let frame = 0;

    const tick = (now: number) => {
      const deltaSeconds = (now - lastTime) / 1000;

      lastTime = now;

      animator.update(animatedSatellites.current, deltaSeconds);

      const positionAttribute = points.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;

      const positionArray = positionAttribute.array as Float32Array;

      satellites.forEach((satellite, index) => {
        const position = positionsRef.current.get(satellite.norad_id);

        if (!position) {
          return;
        }

        const coords = globe.getCoords(
          position.latitude,
          position.longitude,
          position.altitude_km / 6378.137,
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

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [globeRef, satellites]);

  useEffect(() => {
    const globe = globeRef.current;
    const points = pointsRef.current;

    if (!globe || !points) {
      return;
    }

    const renderer = globe.renderer();

    if (!renderer) {
      return;
    }

    const canvas = renderer.domElement;

    const raycaster = new THREE.Raycaster();

    raycaster.params.Points.threshold = 1.8;

    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, globe.camera());

      const intersections = raycaster.intersectObject(points, false);

      if (intersections.length === 0) {
        return;
      }

      const intersection = intersections[0];

      if (intersection.index == null) {
        return;
      }

      const noradId = noradIdsRef.current[intersection.index];

      if (noradId == null) {
        return;
      }

      onSelect(noradId);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [globeRef, onSelect]);

  //
  // Keep the component mounted for the Three.js layer.
  //
  return null;
}
