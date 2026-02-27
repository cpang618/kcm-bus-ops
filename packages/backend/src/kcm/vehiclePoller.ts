import type { Vehicle, HeadwayResult } from "@bus-ops/shared";
import { config } from "../config.js";
import { fetchVehiclePositions, fetchTripUpdates } from "./gtfsRtClient.js";
import { transformVehicles } from "./transformer.js";
import { getGtfsStore } from "../gtfs/loader.js";
import { computeHeadways } from "../headway/engine.js";

// ─── State ────────────────────────────────────────────────────────────────────

let cachedVehicles: Vehicle[] = [];
let cachedHeadways: HeadwayResult[] = [];
let lastFetchedAt: Date | null = null;
let consecutiveFailures = 0;
let running = false;
let stopped = false;

// ─── Public API ───────────────────────────────────────────────────────────────

export function getCachedVehicles(): Vehicle[] {
  return cachedVehicles;
}

export function getCachedHeadways(): HeadwayResult[] {
  return cachedHeadways;
}

export function getLastFetchedAt(): Date | null {
  return lastFetchedAt;
}

export function startPolling(): void {
  stopped = false;
  void loop();
}

export function stopPolling(): void {
  stopped = true;
}

// ─── Poll Loop ───────────────────────────────────────────────────────────────

async function loop(): Promise<void> {
  while (!stopped) {
    await poll();
    await new Promise<void>((resolve) => setTimeout(resolve, config.pollIntervalMs));
  }
}

// ─── Poll Logic ───────────────────────────────────────────────────────────────

async function poll(): Promise<void> {
  if (running) return;
  running = true;
  try {
    // Fetch both feeds in parallel
    const [vpEntities, tuEntities] = await Promise.all([
      fetchVehiclePositions(),
      fetchTripUpdates(),
    ]);

    const gtfsStore = getGtfsStore();
    const now = new Date();

    const { vehicles, onwardCallsByVehicle } = transformVehicles(vpEntities, tuEntities, gtfsStore);
    const headways = computeHeadways(vehicles, onwardCallsByVehicle, gtfsStore, now);

    cachedVehicles = vehicles;
    cachedHeadways = headways;
    lastFetchedAt = now;
    consecutiveFailures = 0;

    console.log(
      `[Poller] ${now.toISOString()} — ${vehicles.length} vehicles, ${headways.length} headways computed`,
    );
  } catch (err) {
    consecutiveFailures++;
    console.error(`[Poller] Fetch failed (attempt ${consecutiveFailures}):`, err);

    if (consecutiveFailures >= config.maxConsecutiveFailures) {
      console.warn(
        `[Poller] ${consecutiveFailures} consecutive failures — serving stale data`,
      );
    }
  } finally {
    running = false;
  }
}
