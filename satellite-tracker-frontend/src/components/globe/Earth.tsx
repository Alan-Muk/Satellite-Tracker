import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;
}

export default function Earth({ globeRef }: Props) {
  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

    const scene = globe.scene();
    const controls = globe.controls();

    //
    // Dark space background
    //
    scene.background = new THREE.Color("#02040a");

    //
    // Slow Earth rotation
    //
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.02;

    return () => {
      controls.autoRotate = false;
    };
  }, [globeRef]);

  return null;
}
