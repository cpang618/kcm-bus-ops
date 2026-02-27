import { parse } from "csv-parse/sync";
import type { GtfsRoute, GtfsStop, GtfsTrip, StopTime, FrequencyWindow, ShapePoint, GtfsCalendar, GtfsCalendarDate } from "@bus-ops/shared";
import { getRouteCategoryForRoute, haversineMeters, parseGtfsTime } from "@bus-ops/shared";

function parseCsv(content: string): Record<string, string>[] {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];
}

export function parseRoutes(csv: string): GtfsRoute[] {
  return parseCsv(csv).map((r) => {
    const shortName = r["route_short_name"] ?? r["route_id"] ?? "";
    const color = r["route_color"] ?? "";
    return {
      routeId: r["route_id"] ?? "",
      routeShortName: shortName,
      routeLongName: r["route_long_name"] ?? "",
      routeColor: color || "FDB71A",
      routeTextColor: r["route_text_color"] ?? "000000",
      routeCategory: getRouteCategoryForRoute(shortName, color, r["route_type"] ?? "3"),
    };
  });
}

export function parseStops(csv: string): Map<string, GtfsStop> {
  const map = new Map<string, GtfsStop>();
  for (const r of parseCsv(csv)) {
    const stopId = r["stop_id"] ?? "";
    if (!stopId) continue;
    map.set(stopId, {
      stopId,
      stopName: r["stop_name"] ?? "",
      lat: parseFloat(r["stop_lat"] ?? "0"),
      lng: parseFloat(r["stop_lon"] ?? "0"),
    });
  }
  return map;
}

export function parseTrips(csv: string): GtfsTrip[] {
  return parseCsv(csv).map((r) => ({
    tripId: r["trip_id"] ?? "",
    routeId: r["route_id"] ?? "",
    directionId: (parseInt(r["direction_id"] ?? "0", 10) as 0 | 1),
    shapeId: r["shape_id"] ?? "",
    serviceId: r["service_id"] ?? "",
    tripHeadsign: r["trip_headsign"] ?? "",
  }));
}

export function parseShapes(csv: string): Map<string, ShapePoint[]> {
  const raw = new Map<string, Array<{ lat: number; lng: number; seq: number }>>();
  for (const r of parseCsv(csv)) {
    const id = r["shape_id"] ?? "";
    if (!id) continue;
    let pts = raw.get(id);
    if (!pts) raw.set(id, pts = []);
    pts.push({
      lat: parseFloat(r["shape_pt_lat"] ?? "0"),
      lng: parseFloat(r["shape_pt_lon"] ?? "0"),
      seq: parseInt(r["shape_pt_sequence"] ?? "0", 10),
    });
  }
  const result = new Map<string, ShapePoint[]>();
  for (const [shapeId, points] of raw) {
    points.sort((a, b) => a.seq - b.seq);
    let cumulative = 0;
    const shapePoints: ShapePoint[] = [];
    for (let i = 0; i < points.length; i++) {
      if (i > 0) {
        cumulative += haversineMeters(points[i - 1]!.lat, points[i - 1]!.lng, points[i]!.lat, points[i]!.lng);
      }
      shapePoints.push({
        lat: points[i]!.lat,
        lng: points[i]!.lng,
        sequence: points[i]!.seq,
        cumulativeDistanceMeters: cumulative,
      });
    }
    result.set(shapeId, shapePoints);
  }
  return result;
}

export function parseFirstStopTimes(csv: string): Map<string, StopTime> {
  const map = new Map<string, StopTime>();
  for (const r of parseCsv(csv)) {
    const tripId = r["trip_id"] ?? "";
    if (!tripId) continue;
    const seq = parseInt(r["stop_sequence"] ?? "0", 10);
    const existing = map.get(tripId);
    if (existing !== undefined && existing.stopSequence <= seq) continue;
    map.set(tripId, {
      tripId,
      stopId: r["stop_id"] ?? "",
      stopSequence: seq,
      arrivalTimeSecs: parseGtfsTime(r["arrival_time"] ?? "0:0:0"),
      departureTimeSecs: parseGtfsTime(r["departure_time"] ?? "0:0:0"),
    });
  }
  return map;
}

export function parseFrequencies(csv: string): FrequencyWindow[] {
  return parseCsv(csv).map((r) => ({
    tripId: r["trip_id"] ?? "",
    startTimeSecs: parseGtfsTime(r["start_time"] ?? "0:0:0"),
    endTimeSecs: parseGtfsTime(r["end_time"] ?? "0:0:0"),
    headwaySecs: parseInt(r["headway_secs"] ?? "0", 10),
    exactTimes: r["exact_times"] === "1",
  }));
}

export function parseCalendar(csv: string): GtfsCalendar[] {
  return parseCsv(csv).map((r) => ({
    serviceId: r["service_id"] ?? "",
    monday: r["monday"] === "1",
    tuesday: r["tuesday"] === "1",
    wednesday: r["wednesday"] === "1",
    thursday: r["thursday"] === "1",
    friday: r["friday"] === "1",
    saturday: r["saturday"] === "1",
    sunday: r["sunday"] === "1",
    startDate: r["start_date"] ?? "",
    endDate: r["end_date"] ?? "",
  }));
}

export function parseCalendarDates(csv: string): GtfsCalendarDate[] {
  return parseCsv(csv).map((r) => ({
    serviceId: r["service_id"] ?? "",
    date: r["date"] ?? "",
    exceptionType: (parseInt(r["exception_type"] ?? "1", 10) as 1 | 2),
  }));
}
