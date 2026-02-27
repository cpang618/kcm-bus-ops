import { useState, useEffect } from "react";
import { api } from "../api/client.js";

interface UseRoutesResult {
  routes: GeoJSON.FeatureCollection | null;
  loading: boolean;
  error: string | null;
}

export function useRoutes(): UseRoutesResult {
  const [routes, setRoutes] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .routes()
      .then((data) => { if (!cancelled) setRoutes(data); })
      .catch((err: unknown) => { if (!cancelled) setError(String(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { routes, loading, error };
}
