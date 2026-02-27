import { Router } from "express";
import { getGtfsStore, isGtfsLoaded } from "../gtfs/loader.js";

export const stopsRouter = Router();

let stopsGeoJson: object | null = null;

function buildStopsGeoJson() {
  if (stopsGeoJson) return stopsGeoJson;

  const store = getGtfsStore();
  const features: object[] = [];

  for (const [, stop] of store.stops) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [stop.lng, stop.lat],
      },
      properties: {
        stopId: stop.stopId,
        stopName: stop.stopName,
      },
    });
  }

  stopsGeoJson = { type: "FeatureCollection", features };
  return stopsGeoJson;
}

stopsRouter.get("/stops", (_req, res) => {
  if (!isGtfsLoaded()) {
    res.status(503).json({ error: "GTFS data not yet loaded" });
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=3600");
  res.json(buildStopsGeoJson());
});
