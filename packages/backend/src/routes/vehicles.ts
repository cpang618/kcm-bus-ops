import { Router } from "express";
import { getCachedVehicles, getCachedHeadways, getLastFetchedAt } from "../kcm/vehiclePoller.js";

export const vehiclesRouter = Router();

vehiclesRouter.get("/vehicles", (_req, res) => {
  const fetchedAt = getLastFetchedAt();

  if (!fetchedAt) {
    res.status(503).json({ error: "Vehicle data not yet available — initial fetch in progress" });
    return;
  }

  res.json({
    vehicles: getCachedVehicles(),
    headways: getCachedHeadways(),
    fetchedAt: fetchedAt.toISOString(),
  });
});
