import { config } from "../config.js";

// ─── Raw GTFS-RT JSON Types (only the fields we use) ─────────────────────────

export interface GtfsRtTrip {
  trip_id: string;
  direction_id: number;
  route_id: string;
  start_date: string;
  schedule_relationship: string;
}

export interface GtfsRtVehiclePosition {
  trip: GtfsRtTrip;
  vehicle: { id: string; label: string };
  position: { latitude: number; longitude: number };
  current_stop_sequence: number;
  stop_id: string;
  current_status: string;  // "IN_TRANSIT_TO" | "STOPPED_AT" | "INCOMING_AT"
  block_id: string;
  timestamp: number;
}

export interface GtfsRtStopTimeUpdate {
  stop_sequence: number;
  stop_id: string;
  arrival?: { delay?: number; time: number };
  departure?: { delay?: number; time: number };
  schedule_relationship?: string;
}

export interface GtfsRtTripUpdate {
  trip: GtfsRtTrip;
  stop_time_update: GtfsRtStopTimeUpdate[];
}

export interface VehiclePositionEntity {
  id: string;
  vehicle: GtfsRtVehiclePosition;
}

export interface TripUpdateEntity {
  id: string;
  trip_update: GtfsRtTripUpdate;
}

interface GtfsRtFeed<T> {
  header: { gtfs_realtime_version: string; timestamp: number };
  entity: T[];
}

// ─── Client ──────────────────────────────────────────────────────────────────

async function fetchFeed<T>(url: string, label: string): Promise<T[]> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`KCM ${label} API error: ${response.status} ${response.statusText}`);
  const data = (await response.json()) as GtfsRtFeed<T>;
  return data?.entity ?? [];
}

export function fetchVehiclePositions(): Promise<VehiclePositionEntity[]> {
  return fetchFeed<VehiclePositionEntity>(config.kcmVehiclePositionsUrl, "Vehicle Positions");
}

export function fetchTripUpdates(): Promise<TripUpdateEntity[]> {
  return fetchFeed<TripUpdateEntity>(config.kcmTripUpdatesUrl, "Trip Updates");
}
