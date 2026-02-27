import { useState, useEffect } from "react";
import type { StopHeadwayResult } from "@bus-ops/shared";
import { api } from "../api/client.js";

const POLL_INTERVAL_MS = 15_000;

interface UseStopHeadwaysResult {
  stopHeadways: StopHeadwayResult[];
  loading: boolean;
  error: string | null;
}

export function useStopHeadways(): UseStopHeadwaysResult {
  const [stopHeadways, setStopHeadways] = useState<StopHeadwayResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStopHeadways() {
      try {
        const result = await api.stopHeadways();
        setStopHeadways(result.stopHeadways);
        setError(null);
        setLoading(false);
      } catch (err: unknown) {
        setError(String(err));
        setLoading(false);
      }
    }

    void fetchStopHeadways();
    const interval = setInterval(() => void fetchStopHeadways(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return { stopHeadways, loading, error };
}
