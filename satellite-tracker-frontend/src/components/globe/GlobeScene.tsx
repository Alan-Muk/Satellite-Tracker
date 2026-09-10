import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;
}

export default function GlobeScene({ globeRef }: Props) {
  const initialized = useRef(false);

  useEffect(() => {
    const globe = globeRef.current;

    if (!globe || initialized.current) {
      return;
    }

    initialized.current = true;

    //
    // Initial camera
    //
    globe.pointOfView(
      {
        lat: 20,

        lng: 0,

        altitude: 1.41,
      },
      0,
    );

    //
    // Camera / controls
    //
    const controls = globe.controls();

    controls.enableZoom = true;

    controls.enablePan = false;

    controls.enableRotate = true;

    controls.minDistance = 1.05;

    controls.maxDistance = 4;

    //
    // Disable automatic damping.
    //
    controls.enableDamping = false;
  }, [globeRef]);

  return null;
}
