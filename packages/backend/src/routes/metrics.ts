import { Router } from "express";
import type { ThresholdParams } from "@bus-ops/shared";
import { DEFAULT_THRESHOLDS } from "@bus-ops/shared";
import { getCachedHeadways, getLastFetchedAt } from "../kcm/vehiclePoller.js";
import { getGtfsStore, isGtfsLoaded } from "../gtfs/loader.js";
import { computeMetrics } from "../headway/metrics.js";

export const metricsRouter = Router();

function clamp(value: unknown, def: number, min: number, max: number): number {
  if (value == null || value === "") return def;
  const n = parseFloat(String(value));
  return isNaN(n) ? def : Math.max(min, Math.min(max, n));
}

metricsRouter.get("/metrics", (req, res) => {
  if (!isGtfsLoaded()) { res.status(503).json({ error: "GTFS data not yet loaded" }); return; }

  const fetchedAt = getLastFetchedAt();
  if (!fetchedAt) { res.status(503).json({ error: "Vehicle data not yet available" }); return; }

  const mode = (req.query["mode"] as string) ?? DEFAULT_THRESHOLDS.mode;
  if (mode !== "pct" && mode !== "abs") { res.status(400).json({ error: "mode must be 'pct' or 'abs'" }); return; }

  const thresholds: ThresholdParams = {
    mode,
    bunchingPct:  clamp(req.query["bunchingPct"],  DEFAULT_THRESHOLDS.bunchingPct,  1, 100),
    gappingPct:   clamp(req.query["gappingPct"],    DEFAULT_THRESHOLDS.gappingPct,   100, 500),
    bunchingMins: clamp(req.query["bunchingMins"],  DEFAULT_THRESHOLDS.bunchingMins, 0.5, 30),
    gappingMins:  clamp(req.query["gappingMins"],   DEFAULT_THRESHOLDS.gappingMins,  1, 60),
  };

  res.setHeader("Cache-Control", "no-store");
  res.json(computeMetrics(getCachedHeadways(), thresholds, getGtfsStore(), fetchedAt));
});
