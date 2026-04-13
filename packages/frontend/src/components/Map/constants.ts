import type { HeadwayStatus, OtpStatus } from "@bus-ops/shared";

export const STATUS_COLORS: Record<HeadwayStatus, string> = {
  bunching: "#E63946",
  "on-time": "#2DC653",
  gapping: "#F4A261",
  unknown: "#ADB5BD",
};

export const OTP_STATUS_COLORS: Record<OtpStatus, string> = {
  early: "#F4A261",
  "on-time": "#2DC653",
  late: "#E63946",
  unknown: "#ADB5BD",
};
