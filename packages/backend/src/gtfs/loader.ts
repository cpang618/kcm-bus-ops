import { createWriteStream, existsSync, mkdirSync, unlinkSync } from "fs";
import { get as httpsGet } from "https";
import { get as httpGet } from "http";
import AdmZip from "adm-zip";
import type { GtfsStore } from "@bus-ops/shared";
import { config } from "../config.js";
import {
  parseRoutes,
  parseStops,
  parseTrips,
  parseShapes,
  parseFirstStopTimes,
  parseFrequencies,
  parseCalendar,
  parseCalendarDates,
} from "./parser.js";
import { buildRouteToShapeMap } from "./shapeIndex.js";
import {
  buildFrequencyIndex,
  buildRouteScheduleDepartures,
  buildFirstStopsIndex,
} from "./scheduleIndex.js";

let gtfsStore: GtfsStore | null = null;

export function getGtfsStore(): GtfsStore {
  if (!gtfsStore) throw new Error("GTFS store not loaded yet");
  return gtfsStore;
}

export function isGtfsLoaded(): boolean {
  return gtfsStore !== null;
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath);
    function doGet(targetUrl: string) {
      const getFunc = targetUrl.startsWith("https") ? httpsGet : httpGet;
      getFunc(targetUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const loc = response.headers.location;
          if (!loc) { reject(new Error(`Redirect with no Location header from ${targetUrl}`)); return; }
          doGet(loc);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} downloading ${targetUrl}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => { file.close(); resolve(); });
        file.on("error", reject);
      }).on("error", reject);
    }
    doGet(url);
  });
}

async function ensureDownloaded(url: string): Promise<string> {
  const destPath = `${config.gtfsDataDir}/kcm.zip`;
  if (existsSync(destPath)) {
    try {
      new AdmZip(destPath);
      console.log("[GTFS] Using cached kcm.zip");
      return destPath;
    } catch {
      console.warn("[GTFS] Cached kcm.zip is corrupt — re-downloading");
      try { unlinkSync(destPath); } catch { /* ignore */ }
    }
  }
  console.log(`[GTFS] Downloading KCM GTFS from ${url} ...`);
  await downloadFile(url, destPath);
  console.log("[GTFS] Downloaded kcm.zip");
  return destPath;
}

function readZipFile(zip: AdmZip, filename: string): string | null {
  const match = zip.getEntries().find(
    (e) => e.entryName === filename || e.entryName.endsWith(`/${filename}`),
  );
  return match ? zip.readAsText(match) : null;
}

export async function loadGtfs(): Promise<void> {
  mkdirSync(config.gtfsDataDir, { recursive: true });
  const zipPath = await ensureDownloaded(config.gtfsUrl);
  console.log("[GTFS] Parsing KCM GTFS feed...");

  let zip: AdmZip;
  try {
    zip = new AdmZip(zipPath);
  } catch (err) {
    try { unlinkSync(zipPath); } catch { /* ignore */ }
    throw new Error(`Invalid GTFS zip: ${err}`);
  }

  const routesCsv = readZipFile(zip, "routes.txt");
  const stopsCsv = readZipFile(zip, "stops.txt");
  const tripsCsv = readZipFile(zip, "trips.txt");
  const shapesCsv = readZipFile(zip, "shapes.txt");
  const stopTimesCsv = readZipFile(zip, "stop_times.txt");
  const frequenciesCsv = readZipFile(zip, "frequencies.txt");
  const calendarCsv = readZipFile(zip, "calendar.txt");
  const calendarDatesCsv = readZipFile(zip, "calendar_dates.txt");

  if (!routesCsv) throw new Error("routes.txt not found in GTFS zip");
  if (!stopsCsv) throw new Error("stops.txt not found in GTFS zip");
  if (!tripsCsv) throw new Error("trips.txt not found in GTFS zip");
  if (!shapesCsv) throw new Error("shapes.txt not found in GTFS zip");

  const routesList = parseRoutes(routesCsv);
  const stops = parseStops(stopsCsv);
  const trips = parseTrips(tripsCsv);
  const shapes = parseShapes(shapesCsv);
  const stopTimes = stopTimesCsv ? parseFirstStopTimes(stopTimesCsv) : new Map();
  const frequenciesRaw = frequenciesCsv ? parseFrequencies(frequenciesCsv) : [];
  const calendars = calendarCsv ? parseCalendar(calendarCsv) : [];
  const calendarDates = calendarDatesCsv ? parseCalendarDates(calendarDatesCsv) : [];

  console.log(
    `[GTFS] Parsed ${routesList.length} routes, ${stops.size} stops, ` +
    `${trips.length} trips, ${shapes.size} shapes, ` +
    `${calendars.length} calendar entries, ${calendarDates.length} calendar exceptions`,
  );

  const routes = new Map(routesList.map((r) => [r.routeId, r]));
  const tripsMap = new Map(trips.map((t) => [t.tripId, t]));

  const routeTrips = new Map<string, typeof trips>();
  for (const trip of trips) {
    const key = `${trip.routeId}:${trip.directionId}`;
    let rt = routeTrips.get(key);
    if (!rt) routeTrips.set(key, rt = []);
    rt.push(trip);
  }

  const routeToShapeId = buildRouteToShapeMap(trips);
  const frequencyIndex = buildFrequencyIndex(frequenciesRaw, trips);
  const routeScheduleDepartures = buildRouteScheduleDepartures(stopTimes, trips);
  const firstStopsByRoute = buildFirstStopsIndex(stopTimes, trips);

  console.log(
    `[GTFS] Frequency index: ${frequencyIndex.size} route+dirs | ` +
    `Route departures: ${routeScheduleDepartures.size} route+dir+service keys | ` +
    `First stops: ${firstStopsByRoute.size} route+dirs`,
  );

  gtfsStore = {
    routes,
    shapes,
    routeToShapeId,
    stops,
    trips: tripsMap,
    routeTrips,
    frequencies: frequencyIndex,
    routeScheduleDepartures,
    stopDepartures: new Map(),
    stopDistances: new Map(),
    firstStopsByRoute,
    calendars,
    calendarDates,
  };

  console.log("[GTFS] Store ready");
}
