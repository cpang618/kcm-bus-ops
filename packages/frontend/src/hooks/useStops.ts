import { useState, useEffect } from "react";
import { api } from "../api/client.js";

interface UseStopsResult {
  stops: GeoJSON.FeatureCollection | null;
  loading: boolean;
  error: string | null;
}

export function useStops(): UseStopsResult {
  const [stops, setStops] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .stops()
      .then((data) => { if (!cancelled) setStops(data); })
      .catch((err: unknown) => { if (!cancelled) setError(String(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { stops, loading, error };
}
