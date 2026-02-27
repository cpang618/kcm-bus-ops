import type { HeadwayStatus } from "@bus-ops/shared";

export const STATUS_COLORS: Record<HeadwayStatus, string> = {
  bunching: "#E63946",
  "on-time": "#2DC653",
  gapping: "#F4A261",
  unknown: "#ADB5BD",
};
