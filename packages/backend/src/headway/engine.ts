import type { Vehicle, HeadwayResult, GtfsStore, OnwardCall } from "@bus-ops/shared";
import { config } from "../config.js";
import { getScheduledHeadway } from "../gtfs/scheduleIndex.js";

const DEFAULT_BUS_SPEED_MS = 5.0; // 5 m/s ~ 18 km/h

/**
 * Core headway calculation engine.
 *
 * For each route+direction group:
 * 1. Sort vehicles by distanceAlongRoute descending (index 0 = lead bus).
 * 2. For each following bus, find the furthest-ahead stop that both it and
 *    its leader have as an upcoming stop in their OnwardCalls.
 * 3. Actual headway = ETA gap at that shared reference stop.
 *    Falls back to distance/speed estimate when no shared stop exists.
 */
export function computeHeadways(
  vehicles: Vehicle[],
  onwardCallsByVehicle: Map<string, OnwardCall[]>,
  gtfsStore: GtfsStore,
  now: Date,
): HeadwayResult[] {
  const results: HeadwayResult[] = [];

  // Group by route + direction
  const groups = new Map<string, Vehicle[]>();
  for (const v of vehicles) {
    if (v.distanceAlongRoute === 0 || v.progressRate === "layover" ||
        (v.nextStopId && gtfsStore.firstStopsByRoute.get(`${v.routeId}:${v.directionId}`)?.has(v.nextStopId))) {
      results.push(unknownResult(v, true));
      continue;
    }
    const key = `${v.routeId}:${v.directionId}`;
    let g = groups.get(key);
    if (!g) groups.set(key, g = []);
    g.push(v);
  }

  for (const [key, groupVehicles] of groups) {
    const sep = key.indexOf(":");
    const routeId = key.slice(0, sep);
    const directionId = parseInt(key.slice(sep + 1), 10) as 0 | 1;

    groupVehicles.sort((a, b) => b.distanceAlongRoute - a.distanceAlongRoute);

    const scheduledHeadwaySecs = getScheduledHeadway(routeId, directionId, now, gtfsStore);

    for (let i = 0; i < groupVehicles.length; i++) {
      const vehicle = groupVehicles[i]!;

      if (i === 0) {
        results.push(unknownResult(vehicle, true, scheduledHeadwaySecs));
        continue;
      }

      const leader = groupVehicles[i - 1]!;
      const vehicleCalls = onwardCallsByVehicle.get(vehicle.vehicleRef) ?? [];
      const leaderCalls  = onwardCallsByVehicle.get(leader.vehicleRef)  ?? [];

      const etaGap = findLastSharedStopGap(vehicle, leader, vehicleCalls, leaderCalls);
      const headwayMethod = etaGap !== null ? "eta" : "distance";
      const actualHeadwaySecs = etaGap ?? distanceFallback(vehicle, leader);

      const capped = Math.min(actualHeadwaySecs, config.maxHeadwayCapSecs);
      results.push({
        vehicleRef: vehicle.vehicleRef, routeId, directionId,
        leadVehicleRef: leader.vehicleRef,
        actualHeadwaySecs: capped, scheduledHeadwaySecs,
        headwayRatioPct: scheduledHeadwaySecs && scheduledHeadwaySecs > 0 ? (capped / scheduledHeadwaySecs) * 100 : null,
        status: "unknown", headwayMethod, excluded: false,
      });
    }
  }

  return results;
}

function unknownResult(v: Vehicle, excluded: boolean, scheduledHeadwaySecs: number | null = null): HeadwayResult {
  return {
    vehicleRef: v.vehicleRef, routeId: v.routeId, directionId: v.directionId,
    leadVehicleRef: null, actualHeadwaySecs: null, scheduledHeadwaySecs,
    headwayRatioPct: null, status: "unknown", headwayMethod: null, excluded,
  };
}

/**
 * Finds the ETA gap between vehicle and leader at the furthest shared upcoming stop.
 * KCM stop IDs are plain GTFS IDs — no normalization needed (unlike MTA's "MTA_" prefix).
 */
function findLastSharedStopGap(
  vehicle: Vehicle,
  leader: Vehicle,
  vehicleCalls: OnwardCall[],
  leaderCalls: OnwardCall[],
): number | null {
  if (vehicleCalls.length === 0) return null;

  const leaderEtas = new Map<string, number>();

  if (leader.nextStopId && leader.expectedArrivalTime) {
    const ms = Date.parse(leader.expectedArrivalTime);
    if (!isNaN(ms)) leaderEtas.set(leader.nextStopId, ms);
  }

  for (const call of leaderCalls) {
    if (!call.StopPointRef) continue;
    const eta = call.ExpectedArrivalTime ?? call.AimedArrivalTime;
    if (!eta) continue;
    const ms = Date.parse(eta);
    if (!isNaN(ms)) leaderEtas.set(call.StopPointRef, ms);
  }

  if (leaderEtas.size === 0) return null;

  for (let i = vehicleCalls.length - 1; i >= 0; i--) {
    const call = vehicleCalls[i]!;
    if (!call.StopPointRef) continue;

    const leaderEtaMs = leaderEtas.get(call.StopPointRef);
    if (leaderEtaMs === undefined) continue;

    const vehicleEta = call.ExpectedArrivalTime ?? call.AimedArrivalTime;
    if (!vehicleEta) continue;

    const vehicleEtaMs = Date.parse(vehicleEta);
    if (isNaN(vehicleEtaMs)) continue;

    const gapMs = vehicleEtaMs - leaderEtaMs;
    if (gapMs > 0) return gapMs / 1000;
  }

  return null;
}

function distanceFallback(vehicle: Vehicle, leader: Vehicle): number {
  const gapMeters = leader.distanceAlongRoute - vehicle.distanceAlongRoute;
  if (gapMeters <= 0) return 0;
  return gapMeters / DEFAULT_BUS_SPEED_MS;
}
