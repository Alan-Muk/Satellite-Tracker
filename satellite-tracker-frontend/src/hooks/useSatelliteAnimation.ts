import { useEffect, useRef } from "react";

import {
  SatelliteAnimator,
  type AnimatedSatellitePosition,
  type AnimatedSatellite,
} from "../components/globe/SatelliteAnimator";

interface Props {
  satellites: AnimatedSatellite[];

  onPositionUpdate: (
    noradId: number,
    position: AnimatedSatellitePosition,
  ) => void;
}

export function useSatelliteAnimation({ satellites, onPositionUpdate }: Props) {
  const animator = useRef<SatelliteAnimator | null>(null);

  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    animator.current = new SatelliteAnimator(onPositionUpdate);

    let lastTime = performance.now();

    const tick = (now: number) => {
      const deltaSeconds = (now - lastTime) / 1000;

      lastTime = now;

      animator.current?.update(satellites, deltaSeconds);

      animationFrame.current = requestAnimationFrame(tick);
    };

    animationFrame.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);

        animationFrame.current = null;
      }

      animator.current = null;
    };
  }, [satellites, onPositionUpdate]);
}
