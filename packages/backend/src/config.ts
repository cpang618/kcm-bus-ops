import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../../../.env") });

export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),

  // KCM GTFS static feed (single zip)
  gtfsUrl: "https://metro.kingcounty.gov/GTFS/google_transit.zip",
  gtfsDataDir: resolve(__dirname, "../../../data/gtfs"),

  // KCM GTFS-RT feeds (publicly accessible, no API key needed)
  kcmVehiclePositionsUrl: "https://s3.amazonaws.com/kcm-alerts-realtime-prod/vehiclepositions_enhanced.json",
  kcmTripUpdatesUrl: "https://s3.amazonaws.com/kcm-alerts-realtime-prod/tripupdates_enhanced.json",

  pollIntervalMs: 60_000,          // 60 seconds
  maxConsecutiveFailures: 3,
  maxHeadwayCapSecs: 1800,         // 30 minutes — cap outliers
};
