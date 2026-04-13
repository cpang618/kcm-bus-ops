import { useMemo } from "react";
import type { Vehicle, OtpThresholdParams, OtpBreakdown, OtpRouteMetrics, OtpStatus } from "@bus-ops/shared";
import { classifyOtp, getRouteCategoryForRoute } from "@bus-ops/shared";

export interface OtpMetricsResult {
  cityMetrics: OtpBreakdown;
  routeMetrics: OtpRouteMetrics[];
  otpByVehicle: Map<string, OtpStatus>;
}

function emptyBreakdown(): OtpBreakdown {
  return { total: 0, earlyCount: 0, onTimeCount: 0, lateCount: 0, unknownCount: 0, earlyPct: 0, onTimePct: 0, latePct: 0 };
}

function finalizePcts(b: OtpBreakdown): void {
  if (b.total > 0) {
    b.earlyPct = Math.round((b.earlyCount / b.total) * 1000) / 10;
    b.onTimePct = Math.round((b.onTimeCount / b.total) * 1000) / 10;
    b.latePct = Math.round((b.lateCount / b.total) * 1000) / 10;
  }
}

function addToBreakdown(b: OtpBreakdown, status: OtpStatus): void {
  if (status === "unknown") { b.unknownCount++; return; }
  b.total++;
  if (status === "early") b.earlyCount++;
  else if (status === "late") b.lateCount++;
  else b.onTimeCount++;
}

export function useOtpMetrics(vehicles: Vehicle[], thresholds: OtpThresholdParams): OtpMetricsResult {
  return useMemo(() => {
    const otpByVehicle = new Map<string, OtpStatus>();
    const city = emptyBreakdown();
    const routeMap = new Map<string, { breakdown: OtpBreakdown; routeId: string; directionId: 0 | 1; routeShortName: string; vehicleCount: number }>();

    for (const v of vehicles) {
      if (v.progressRate === "layover") {
        otpByVehicle.set(v.vehicleRef, "unknown");
        continue;
      }

      const status = classifyOtp(v, thresholds);
      otpByVehicle.set(v.vehicleRef, status);
      addToBreakdown(city, status);

      const key = `${v.routeId}:${v.directionId}`;
      let entry = routeMap.get(key);
      if (!entry) {
        entry = { breakdown: emptyBreakdown(), routeId: v.routeId, directionId: v.directionId, routeShortName: v.routeShortName, vehicleCount: 0 };
        routeMap.set(key, entry);
      }
      entry.vehicleCount++;
      addToBreakdown(entry.breakdown, status);
    }

    finalizePcts(city);

    const routeMetrics: OtpRouteMetrics[] = [];
    for (const entry of routeMap.values()) {
      finalizePcts(entry.breakdown);
      routeMetrics.push({
        ...entry.breakdown,
        routeId: entry.routeId,
        directionId: entry.directionId,
        routeShortName: entry.routeShortName,
        routeCategory: getRouteCategoryForRoute(entry.routeShortName, "", "3"),
        vehicleCount: entry.vehicleCount,
      });
    }

    routeMetrics.sort((a, b) => b.latePct - a.latePct);

    return { cityMetrics: city, routeMetrics, otpByVehicle };
  }, [vehicles, thresholds]);
}
