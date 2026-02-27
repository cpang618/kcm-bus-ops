import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "./config.js";
import { loadGtfs, isGtfsLoaded, getGtfsStore } from "./gtfs/loader.js";
import { startPolling, getLastFetchedAt, getCachedVehicles } from "./kcm/vehiclePoller.js";
import { vehiclesRouter } from "./routes/vehicles.js";
import { routesRouter } from "./routes/routes.js";
import { stopsRouter } from "./routes/stops.js";
import { metricsRouter } from "./routes/metrics.js";
import { stopHeadwaysRouter } from "./routes/stopHeadways.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  const gtfsLoaded = isGtfsLoaded();
  const store = gtfsLoaded ? getGtfsStore() : null;
  res.json({
    status: "ok",
    gtfsLoaded,
    lastVehicleFetch: getLastFetchedAt()?.toISOString() ?? null,
    vehicleCount: getCachedVehicles().length,
    routeCount: store?.routes.size ?? 0,
    stopCount: store?.stops.size ?? 0,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

for (const r of [vehiclesRouter, routesRouter, stopsRouter, metricsRouter, stopHeadwaysRouter]) {
  app.use("/api", r);
}

// ─── Frontend Static Files ────────────────────────────────────────────────────

const frontendDist = join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));

app.get("*", (_req, res) => {
  res.sendFile(join(frontendDist, "index.html"));
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────

async function bootstrap() {
  app.listen(config.port, () => {
    console.log(`[Server] Listening on http://localhost:${config.port}`);
  });

  try {
    await loadGtfs();
    // KCM feeds are publicly accessible — no API key check needed
    startPolling();
  } catch (err) {
    console.error("[Bootstrap] GTFS load failed:", err);
    console.error("[Bootstrap] Server remains running but data will be unavailable.");
  }
}

bootstrap().catch((err) => {
  console.error("[Bootstrap] Fatal error:", err);
  process.exit(1);
});
