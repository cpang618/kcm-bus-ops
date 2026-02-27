import { Router } from "express";
import { getGtfsStore, isGtfsLoaded } from "../gtfs/loader.js";

export const routesRouter = Router();

let routesGeoJson: object | null = null;

function buildRoutesGeoJson() {
  if (routesGeoJson) return routesGeoJson;

  const store = getGtfsStore();
  const features: object[] = [];

  for (const [routeId, route] of store.routes) {
    for (const directionId of [0, 1] as const) {
      const shapeId = store.routeToShapeId.get(`${routeId}:${directionId}`);
      if (!shapeId) continue;

      const points = store.shapes.get(shapeId);
      if (!points || points.length < 2) continue;

      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: points.map((p) => [p.lng, p.lat]),
        },
        properties: {
          routeId: route.routeId,
          directionId,
          routeShortName: route.routeShortName,
          routeLongName: route.routeLongName,
          routeColor: `#${route.routeColor || "FDB71A"}`,
          routeTextColor: `#${route.routeTextColor || "000000"}`,
          routeCategory: route.routeCategory,
        },
      });
    }
  }

  routesGeoJson = { type: "FeatureCollection", features };
  return routesGeoJson;
}

routesRouter.get("/routes", (_req, res) => {
  if (!isGtfsLoaded()) {
    res.status(503).json({ error: "GTFS data not yet loaded" });
    return;
  }

  res.setHeader("Cache-Control", "no-cache");
  res.json(buildRoutesGeoJson());
});
