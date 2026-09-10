import { useEffect, useState } from "react";

import type { SatellitePosition } from "../api";

export function useSatelliteSocket() {
  const [satellites, setSatellites] = useState<SatellitePosition[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setSatellites(data);
    };

    return () => {
      ws.close();
    };
  }, []);

  return satellites;
}
