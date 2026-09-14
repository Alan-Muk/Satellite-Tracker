import { useEffect, useState } from "react";

import { getSatellites } from "../api";
import type { OrbitRegion, Satellite } from "../api";

const FETCH_LIMIT = 5000;
const TARGET_TOTAL = 1000;
const PER_REGION_CAP = 100;

/**
 * Regions ordered from outermost to innermost, for tie-breaking.
 * When two regions have the same number of selected satellites,
 * prefer the outer one.
 */
const REGION_PRIORITY: OrbitRegion[] = ["HEO", "GEO", "MEO", "LEO", "VLEO"];

const REGION_RANK: Record<OrbitRegion, number> = Object.fromEntries(
  REGION_PRIORITY.map((r, i) => [r, i]),
) as Record<OrbitRegion, number>;

type Region = Exclude<OrbitRegion, "UNKNOWN">;

function shuffle<T>(items: T[]): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function selectBalanced(pool: Satellite[], target: number): Satellite[] {
  // Partition by region, excluding UNKNOWN (no renderable region).
  const byRegion = new Map<Region, Satellite[]>();
  for (const region of REGION_PRIORITY) {
    byRegion.set(region as Region, []);
  }

  for (const sat of pool) {
    const region = sat.orbit?.region;
    if (!region || region === "UNKNOWN") continue;
    byRegion.get(region as Region)?.push(sat);
  }

  // Shuffle each region's pool so the picks within a region vary per session.
  const shuffled = new Map<Region, Satellite[]>();
  for (const [region, sats] of byRegion) {
    shuffled.set(region, shuffle(sats));
  }

  const selected: Satellite[] = [];
  const selectedPerRegion = new Map<Region, number>();
  for (const region of REGION_PRIORITY) {
    selectedPerRegion.set(region as Region, 0);
  }

  // Step 1: up to PER_REGION_CAP per region.
  for (const region of REGION_PRIORITY) {
    const r = region as Region;
    const available = shuffled.get(r) ?? [];
    const take = Math.min(
      PER_REGION_CAP,
      available.length,
      target - selected.length,
    );
    for (let i = 0; i < take; i++) {
      selected.push(available[i]);
      selectedPerRegion.set(r, (selectedPerRegion.get(r) ?? 0) + 1);
    }
    if (selected.length >= target) return selected;
  }

  // Step 2: fill remaining slots by least-populated region,
  // tie-breaking on outer-first.
  while (selected.length < target) {
    const candidates = REGION_PRIORITY.map((r) => r as Region).filter((r) => {
      const avail = shuffled.get(r) ?? [];
      const taken = selectedPerRegion.get(r) ?? 0;
      return taken < avail.length;
    });

    if (candidates.length === 0) break; // pool exhausted

    candidates.sort((a, b) => {
      const countDiff =
        (selectedPerRegion.get(a) ?? 0) - (selectedPerRegion.get(b) ?? 0);
      if (countDiff !== 0) return countDiff;
      return REGION_RANK[a] - REGION_RANK[b];
    });

    const next = candidates[0];
    const taken = selectedPerRegion.get(next) ?? 0;
    const sat = shuffled.get(next)![taken];
    selected.push(sat);
    selectedPerRegion.set(next, taken + 1);
  }

  return selected;
}

export function useSatelliteData() {
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const all = await getSatellites(FETCH_LIMIT);
        if (cancelled) return;
        setSatellites(selectBalanced(all, TARGET_TOTAL));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { satellites, loading, error };
}
