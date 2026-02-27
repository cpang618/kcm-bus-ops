import { useState, useEffect, useRef } from "react";
import type { VehiclesResponse } from "@bus-ops/shared";
import { api } from "../api/client.js";

const POLL_MS = 15_000;
const STALE_MS = 30_000;
const CLOCK_MS = 5_000;

export function useLiveVehicles() {
  const [data, setData] = useState<VehiclesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    async function fetch() {
      try {
        const result = await api.vehicles();
        if (!mounted) return;
        setData(result);
        setError(null);
        lastFetchRef.current = Date.now();
        setLoading(false);
        setIsStale(false);
      } catch (err: unknown) {
        if (mounted) { setError(String(err)); setLoading(false); }
      }
    }
    void fetch();
    const poll = setInterval(() => void fetch(), POLL_MS);
    const clock = setInterval(() => {
      if (lastFetchRef.current && Date.now() - lastFetchRef.current > STALE_MS) setIsStale(true);
    }, CLOCK_MS);
    return () => { mounted = false; clearInterval(poll); clearInterval(clock); };
  }, []);

  return { data, loading, error, isStale };
}
