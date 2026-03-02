import { useMemo } from "react";
import type { MethodBreakdown } from "@bus-ops/shared";
import { ThresholdProvider, useThresholds } from "./store/thresholds.js";
import { RouteFilterProvider, useRouteFilter } from "./store/routeFilter.js";
import { useLiveVehicles } from "./hooks/useLiveVehicles.js";
import { useMetrics } from "./hooks/useMetrics.js";
import { useRoutes } from "./hooks/useRoutes.js";
import { useStops } from "./hooks/useStops.js";
import { useStopHeadways } from "./hooks/useStopHeadways.js";
import { MapView } from "./components/Map/MapView.js";
import { RouteLayer } from "./components/Map/RouteLayer.js";
import { StopLayer } from "./components/Map/StopLayer.js";
import { VehicleLayer } from "./components/Map/VehicleLayer.js";
import { StopHeadwayLayer } from "./components/Map/StopHeadwayLayer.js";
import { MetricsPanel } from "./components/MetricsPanel/MetricsPanel.js";
import { RouteFilter } from "./components/Controls/RouteFilter/RouteFilter.js";
import { RoutesPanel } from "./components/RoutesPanel/RoutesPanel.js";
import styles from "./App.module.css";

function AppInner() {
  const { thresholds } = useThresholds();
  const { showStops } = useRouteFilter();

  const { data: vehicleData, loading: vehiclesLoading, isStale } = useLiveVehicles();
  const { data: metricsData, loading: metricsLoading } = useMetrics(thresholds);
  const { routes } = useRoutes();
  const { stops } = useStops();
  const { stopHeadways } = useStopHeadways();

  const vehicles = vehicleData?.vehicles ?? [];
  const headways = vehicleData?.headways ?? [];
  const fetchedAt = vehicleData?.fetchedAt ?? null;

  const methodBreakdown = useMemo<MethodBreakdown | null>(() => {
    if (!headways.length) return null;
    let etaCount = 0;
    let distanceCount = 0;
    for (const h of headways) {
      if (h.headwayMethod === "eta") etaCount++;
      else if (h.headwayMethod === "distance") distanceCount++;
    }
    const total = etaCount + distanceCount;
    if (total === 0) return null;
    return {
      etaCount,
      distanceCount,
      etaPct: Math.round((etaCount / total) * 100),
      distancePct: Math.round((distanceCount / total) * 100),
    };
  }, [headways]);

  const routeFeatures = useMemo(
    () => routes?.features ?? [],
    [routes],
  );

  const excludedCount = Math.max(0, vehicles.length - (metricsData?.cityMetrics.total ?? 0));

  return (
    <div className={styles.app}>
      <MapView>
        <RouteLayer routes={routes} />
        <StopLayer stops={stops} visible={showStops} />
        <VehicleLayer vehicles={vehicles} headways={headways} />
        <StopHeadwayLayer stopHeadways={stopHeadways} />

        <div className={styles.overlay}>
          <MetricsPanel
            data={metricsData}
            loading={metricsLoading || vehiclesLoading}
            fetchedAt={fetchedAt}
            isStale={isStale}
            methodBreakdown={methodBreakdown}
            totalVehicles={vehicles.length}
            excludedCount={excludedCount}
          />
        </div>

        <div className={styles.rightColumn}>
          <RoutesPanel data={metricsData} routeFeatures={routeFeatures} />
          <RouteFilter routeFeatures={routeFeatures} />
        </div>
      </MapView>
    </div>
  );
}

export default function App() {
  return (
    <ThresholdProvider>
      <RouteFilterProvider>
        <AppInner />
      </RouteFilterProvider>
    </ThresholdProvider>
  );
}
