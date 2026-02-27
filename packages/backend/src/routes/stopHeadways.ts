import { Router } from "express";
import type { StopHeadwaysResponse } from "@bus-ops/shared";

export const stopHeadwaysRouter = Router();

stopHeadwaysRouter.get("/stop-headways", (_req, res) => {
  res.json({ stopHeadways: [], fetchedAt: new Date().toISOString() } satisfies StopHeadwaysResponse);
});
