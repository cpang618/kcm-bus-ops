import type { RouteCategory, HeadwayStatus, ThresholdParams } from "./types.js";

const D2R = Math.PI / 180;

interface ClassifiableHeadway {
  actualHeadwaySecs: number | null;
  headwayRatioPct: number | null;
}

function classifyByAbs(secs: number, t: ThresholdParams): HeadwayStatus {
  if (secs < t.bunchingMins * 60) return "bunching";
  if (secs > t.gappingMins * 60) return "gapping";
  return "on-time";
}

export function classifyHeadway(result: ClassifiableHeadway, thresholds: ThresholdParams): HeadwayStatus {
  const { actualHeadwaySecs, headwayRatioPct } = result;
  if (actualHeadwaySecs === null) return "unknown";
  if (thresholds.mode === "abs" || headwayRatioPct === null) return classifyByAbs(actualHeadwaySecs, thresholds);
  if (headwayRatioPct < thresholds.bunchingPct) return "bunching";
  if (headwayRatioPct > thresholds.gappingPct) return "gapping";
  return "on-time";
}

/**
 * Classifies a KCM route into a category based on route_short_name, route_color, and route_type.
 */
export function getRouteCategoryForRoute(routeShortName: string, routeColor: string, routeType: string): RouteCategory {
  const name = routeShortName.trim();
  // RapidRide: "A Line", "B Line", ..., "H Line", or future single-letter/number lines
  if (/^[A-Z] Line$/i.test(name)) return "RapidRide";
  // Streetcar (GTFS route_type 0 = Tram/Streetcar/Light rail)
  if (routeType === "0" || /streetcar/i.test(name)) return "Streetcar";
  // Ferry (GTFS route_type 4)
  if (routeType === "4") return "Ferry";
  // Express: ST Express routes (navy blue color #2B376E)
  if (routeColor.toUpperCase() === "2B376E") return "Express";
  // Community/DART (900-series, shuttles, no color)
  if (/^9\d{2}$/i.test(name) || routeColor === "") return "Community";
  // Default: Local
  return "Local";
}

export function parseGtfsTime(timeStr: string): number {
  const parts = timeStr.trim().split(":");
  if (parts.length !== 3) return 0;
  return parseInt(parts[0]!, 10) * 3600 + parseInt(parts[1]!, 10) * 60 + parseInt(parts[2]!, 10);
}

export function secondsFromMidnight(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const p1 = lat1 * D2R;
  const p2 = lat2 * D2R;
  const dp = (lat2 - lat1) * D2R;
  const dl = (lng2 - lng1) * D2R;
  const a =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearingDegrees(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const p1 = lat1 * D2R;
  const p2 = lat2 * D2R;
  const dl = (lng2 - lng1) * D2R;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
