import type {
  HeadwayResult,
  CityMetrics,
  RouteMetrics,
  MetricsResponse,
  ThresholdParams,
  GtfsStore,
  HeadwayStatus,
} from "@bus-ops/shared";
import { classifyHeadway } from "@bus-ops/shared";

function tallyStatus(b: CityMetrics, status: HeadwayStatus): void {
  if (status === "bunching") b.bunchingCount++;
  else if (status === "on-time") b.onTimeCount++;
  else if (status === "gapping") b.gappingCount++;
  else b.unknownCount++;
}

function finalize(b: CityMetrics): void {
  if (b.total <= 0) return;
  b.bunchingPct = (b.bunchingCount / b.total) * 100;
  b.onTimePct   = (b.onTimeCount   / b.total) * 100;
  b.gappingPct  = (b.gappingCount  / b.total) * 100;
}

function mkBreakdown(): CityMetrics {
  return { total: 0, bunchingCount: 0, onTimeCount: 0, gappingCount: 0, unknownCount: 0, bunchingPct: 0, onTimePct: 0, gappingPct: 0 };
}

export function computeMetrics(
  rawResults: HeadwayResult[],
  thresholds: ThresholdParams,
  gtfsStore: GtfsStore,
  fetchedAt: Date,
): MetricsResponse {
  const vehicleCountByRouteDir = new Map<string, number>();
  for (const r of rawResults) {
    const key = `${r.routeId}:${r.directionId}`;
    vehicleCountByRouteDir.set(key, (vehicleCountByRouteDir.get(key) ?? 0) + 1);
  }

  // City-wide + per-route in a single pass over eligible results
  const city = mkBreakdown();
  const routeBreakdowns = new Map<string, { b: CityMetrics; routeId: string; directionId: 0 | 1 }>();

  for (const r of rawResults) {
    if (r.actualHeadwaySecs === null) continue;
    const status = classifyHeadway(r, thresholds);

    city.total++;
    tallyStatus(city, status);

    const key = `${r.routeId}:${r.directionId}`;
    let entry = routeBreakdowns.get(key);
    if (!entry) routeBreakdowns.set(key, entry = { b: mkBreakdown(), routeId: r.routeId, directionId: r.directionId });
    entry.b.total++;
    tallyStatus(entry.b, status);
  }
  finalize(city);

  const routeMetrics: RouteMetrics[] = [];
  for (const [key, { b, routeId, directionId }] of routeBreakdowns) {
    finalize(b);
    const route = gtfsStore.routes.get(routeId);
    routeMetrics.push({
      ...b,
      routeId,
      directionId,
      routeShortName: route?.routeShortName ?? routeId,
      routeCategory: route?.routeCategory ?? "Local",
      vehicleCount: vehicleCountByRouteDir.get(key) ?? 0,
    });
  }

  routeMetrics.sort((a, b) => b.gappingPct - a.gappingPct);

  return {
    fetchedAt: fetchedAt.toISOString(),
    thresholds,
    cityMetrics: city,
    routeMetrics,
  };
}
