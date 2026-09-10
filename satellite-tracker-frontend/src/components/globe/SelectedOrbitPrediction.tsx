import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { GlobeMethods } from "react-globe.gl";

import { getPrediction } from "./predictionStore";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;

  noradId: number;
}

export default function SelectedOrbitPrediction({ globeRef, noradId }: Props) {
  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

    // Keep prediction lookup active for now.
    // The visual prediction path will be wired into the
    // Globe component's pathsData props after the core
    // satellite rendering is compiling again.
    getPrediction(noradId);

    return () => {
      // Nothing to clean up yet.
    };
  }, [globeRef, noradId]);

  return null;
}
