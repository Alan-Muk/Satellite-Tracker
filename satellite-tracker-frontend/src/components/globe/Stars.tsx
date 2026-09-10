import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;
}

const STAR_COUNT = 500;

const STAR_DISTANCE = 100;

export default function Stars({ globeRef }: Props) {
  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

    const scene = globe.scene();

    const positions = new Float32Array(STAR_COUNT * 3);

    const colors = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      //
      // Uniform random direction.
      //
      const theta = Math.random() * Math.PI * 2;

      const phi = Math.acos(2 * Math.random() - 1);

      const sinPhi = Math.sin(phi);

      const x = Math.cos(theta) * sinPhi * STAR_DISTANCE;

      const y = Math.cos(phi) * STAR_DISTANCE;

      const z = Math.sin(theta) * sinPhi * STAR_DISTANCE;

      const offset = i * 3;

      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = z;

      const brightness = 0.6 + Math.random() * 0.4;

      colors[offset] = brightness;
      colors[offset + 1] = brightness;
      colors[offset + 2] = brightness;
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.35,

      sizeAttenuation: false,

      vertexColors: true,

      transparent: true,

      opacity: 0.9,

      depthWrite: false,
    });

    const stars = new THREE.Points(geometry, material);

    stars.name = "star-field";

    scene.add(stars);

    return () => {
      scene.remove(stars);

      geometry.dispose();

      material.dispose();
    };
  }, [globeRef]);

  return null;
}
