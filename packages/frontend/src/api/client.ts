import type {
  VehiclesResponse,
  MetricsResponse,
  HealthResponse,
  ThresholdParams,
  StopHeadwaysResponse,
} from "@bus-ops/shared";

async function fetchApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: () => fetchApi<HealthResponse>("/api/health"),

  vehicles: () => fetchApi<VehiclesResponse>("/api/vehicles"),

  routes: () => fetchApi<GeoJSON.FeatureCollection>("/api/routes"),

  stops: () => fetchApi<GeoJSON.FeatureCollection>("/api/stops"),

  metrics: (t: ThresholdParams) =>
    fetchApi<MetricsResponse>("/api/metrics", {
      mode: t.mode,
      ...(t.mode === "pct"
        ? { bunchingPct: String(t.bunchingPct), gappingPct: String(t.gappingPct) }
        : { bunchingMins: String(t.bunchingMins), gappingMins: String(t.gappingMins) }),
    }),

  stopHeadways: () => fetchApi<StopHeadwaysResponse>("/api/stop-headways"),
};
