import { useState, useEffect } from "react";
import type { MetricsResponse, ThresholdParams } from "@bus-ops/shared";
import { api } from "../api/client.js";

const POLL_MS = 15_000;
const DEBOUNCE_MS = 300;

export function useMetrics(thresholds: ThresholdParams) {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const thresholdKey = JSON.stringify(thresholds);

  useEffect(() => {
    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;
    async function fetch() {
      try {
        const result = await api.metrics(thresholds);
        if (!mounted) return;
        setData(result);
        setError(null);
        setLoading(false);
      } catch (err: unknown) {
        if (mounted) { setError(String(err)); setLoading(false); }
      }
    }
    const debounce = setTimeout(() => {
      void fetch();
      interval = setInterval(() => void fetch(), POLL_MS);
    }, DEBOUNCE_MS);
    return () => { mounted = false; clearTimeout(debounce); if (interval) clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholdKey]);

  return { data, loading, error };
}
