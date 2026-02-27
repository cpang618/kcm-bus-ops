import type { FrequencyWindow, GtfsTrip, StopTime, GtfsStore } from "@bus-ops/shared";
import { secondsFromMidnight } from "@bus-ops/shared";
import { getActiveServiceIds } from "./calendarIndex.js";

function push<K, V>(map: Map<K, V[]>, key: K, val: V): void {
  let arr = map.get(key);
  if (!arr) map.set(key, arr = []);
  arr.push(val);
}

export function buildFrequencyIndex(
  frequencies: FrequencyWindow[],
  trips: GtfsTrip[],
): Map<string, FrequencyWindow[]> {
  const tripToRoute = new Map<string, { routeId: string; directionId: 0 | 1 }>();
  for (const t of trips) {
    tripToRoute.set(t.tripId, { routeId: t.routeId, directionId: t.directionId });
  }

  const index = new Map<string, FrequencyWindow[]>();
  for (const fw of frequencies) {
    const route = tripToRoute.get(fw.tripId);
    if (!route) continue;
    const key = `${route.routeId}:${route.directionId}`;
    push(index, key, fw);
  }

  for (const [, windows] of index) {
    windows.sort((a, b) => a.startTimeSecs - b.startTimeSecs);
  }

  return index;
}

export function buildRouteScheduleDepartures(
  stopTimes: Map<string, StopTime>,
  trips: GtfsTrip[],
): Map<string, number[]> {
  const result = new Map<string, number[]>();
  for (const trip of trips) {
    const firstStop = stopTimes.get(trip.tripId);
    if (!firstStop) continue;
    push(result, `${trip.routeId}:${trip.directionId}:${trip.serviceId}`, firstStop.departureTimeSecs);
  }
  for (const [, times] of result) {
    times.sort((a, b) => a - b);
  }
  return result;
}

export function buildFirstStopsIndex(
  stopTimes: Map<string, StopTime>,
  trips: GtfsTrip[],
): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  for (const trip of trips) {
    const firstStop = stopTimes.get(trip.tripId);
    if (!firstStop) continue;
    const key = `${trip.routeId}:${trip.directionId}`;
    let s = result.get(key);
    if (!s) result.set(key, s = new Set());
    s.add(firstStop.stopId);
  }
  return result;
}

export function getScheduledHeadway(
  routeId: string,
  directionId: 0 | 1,
  now: Date,
  gtfsStore: GtfsStore,
): number | null {
  const key = `${routeId}:${directionId}`;
  const nowSecs = secondsFromMidnight(now);

  const windows = gtfsStore.frequencies.get(key);
  if (windows?.length) {
    for (const w of windows) {
      if (nowSecs >= w.startTimeSecs && nowSecs < w.endTimeSecs) return w.headwaySecs;
    }
    return windows[windows.length - 1]!.headwaySecs;
  }

  const activeServiceIds = getActiveServiceIds(now, gtfsStore.calendars, gtfsStore.calendarDates);
  if (activeServiceIds.size === 0) return null;

  const merged: number[] = [];
  for (const serviceId of activeServiceIds) {
    const times = gtfsStore.routeScheduleDepartures.get(`${key}:${serviceId}`);
    if (times) merged.push(...times);
  }

  if (merged.length < 2) return null;
  merged.sort((a, b) => a - b);
  return headwayFromSortedTimes(merged, nowSecs);
}

function headwayFromSortedTimes(times: number[], nowSecs: number): number | null {
  if (times.length < 2) return null;
  let lo = 0, hi = times.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid]! < nowSecs) lo = mid + 1;
    else hi = mid;
  }
  const afterIdx = Math.min(lo, times.length - 1);
  const beforeIdx = Math.max(afterIdx - 1, 0);
  if (beforeIdx === afterIdx) return null;
  const gap = times[afterIdx]! - times[beforeIdx]!;
  return gap > 0 ? gap : null;
}
