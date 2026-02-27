import type { Vehicle, GtfsStore, StopHeadwayResult, OnwardCall } from "@bus-ops/shared";
import { config } from "../config.js";

interface Arrival {
  vehicleRef: string;
  routeId: string;
  directionId: 0 | 1;
  etaMs: number;
}

function pushTo(map: Map<string, Arrival[]>, key: string, val: Arrival): void {
  let arr = map.get(key);
  if (!arr) map.set(key, arr = []);
  arr.push(val);
}

function parseEta(call: OnwardCall): number | null {
  const raw = call.ExpectedArrivalTime ?? call.AimedArrivalTime;
  if (!raw) return null;
  const ms = Date.parse(raw);
  return isNaN(ms) ? null : ms;
}

/**
 * Computes stop-level headway results.
 * Currently disabled (endpoint returns []) but retained for future use.
 */
export function computeStopHeadways(
  vehicles: Vehicle[],
  onwardCallsByVehicle: Map<string, OnwardCall[]>,
  gtfsStore: GtfsStore,
  _now: Date,
): StopHeadwayResult[] {
  // Composite key: stopId:routeId:directionId → arrivals (pre-grouped)
  const grouped = new Map<string, Arrival[]>();

  for (const vehicle of vehicles) {
    const calls = onwardCallsByVehicle.get(vehicle.vehicleRef);
    const { vehicleRef, routeId, directionId } = vehicle;

    if (calls && calls.length > 0) {
      for (const call of calls) {
        if (!call.StopPointRef) continue;
        const etaMs = parseEta(call);
        if (etaMs === null) continue;
        pushTo(grouped, `${call.StopPointRef}:${routeId}:${directionId}`, { vehicleRef, routeId, directionId, etaMs });
      }
    } else if (vehicle.nextStopId && vehicle.expectedArrivalTime) {
      const etaMs = Date.parse(vehicle.expectedArrivalTime);
      if (!isNaN(etaMs)) {
        pushTo(grouped, `${vehicle.nextStopId}:${routeId}:${directionId}`, { vehicleRef, routeId, directionId, etaMs });
      }
    }
  }

  const results: StopHeadwayResult[] = [];

  for (const [key, group] of grouped) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.etaMs - b.etaMs);

    const first = group[0]!;
    const second = group[1]!;
    const actualHeadwaySecs = (second.etaMs - first.etaMs) / 1000;
    if (actualHeadwaySecs <= 0) continue;

    const stopId = key.slice(0, key.indexOf(":"));
    const stop = gtfsStore.stops.get(stopId);
    if (!stop) continue;

    results.push({
      stopId,
      stopName: stop.stopName,
      lat: stop.lat,
      lng: stop.lng,
      routeId: first.routeId,
      directionId: first.directionId,
      leadVehicleRef: first.vehicleRef,
      followVehicleRef: second.vehicleRef,
      actualHeadwaySecs: Math.min(actualHeadwaySecs, config.maxHeadwayCapSecs),
      scheduledHeadwaySecs: null,
      headwayRatioPct: null,
      status: "unknown",
    });
  }

  return results;
}
