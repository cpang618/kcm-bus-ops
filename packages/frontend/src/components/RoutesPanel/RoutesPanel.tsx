import { useState, useCallback } from "react";
import type { MetricsResponse, OtpRouteMetrics, ViewMode } from "@bus-ops/shared";
import { useMap } from "../Map/MapView.js";
import { useRouteFilter } from "../../store/routeFilter.js";
import { RouteMetrics } from "../MetricsPanel/RouteMetrics.js";
import { OtpRouteRow } from "../MetricsPanel/OtpRouteRow.js";
import styles from "./RoutesPanel.module.css";

interface RoutesPanelProps {
  data: MetricsResponse | null;
  routeFeatures: GeoJSON.Feature[];
  viewMode: ViewMode;
  otpRouteMetrics: OtpRouteMetrics[];
}

export function RoutesPanel({ data, routeFeatures, viewMode, otpRouteMetrics }: RoutesPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const map = useMap();
  const { selectOnly } = useRouteFilter();

  const handleRowClick = useCallback(
    (routeId: string, directionId: 0 | 1) => {
      selectOnly(routeId, directionId);
      if (!map) return;
      const feature = routeFeatures.find(
        (f) => f.properties?.routeId === routeId && f.properties?.directionId === directionId,
      );
      if (!feature || feature.geometry.type !== "LineString") return;
      const [lng, lat] = (feature.geometry as GeoJSON.LineString).coordinates[0];
      map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
    },
    [map, routeFeatures, selectOnly],
  );

  const isOtp = viewMode === "otp";

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>Routes &mdash; sorted by {isOtp ? "lateness" : "gapping"}</span>
          <button className={styles.collapseBtn} onClick={() => setIsOpen((o) => !o)} title={isOpen ? "Collapse" : "Expand"}>
            {isOpen ? "\u25b2" : "\u25bc"}
          </button>
        </div>

        <div className={`${styles.body} ${isOpen ? styles.bodyOpen : ""}`}>
          <div className={styles.subheader}>
            <span className={styles.subRoute}>Route</span>
            <span className={styles.subBar} />
            <div className={styles.subStats}>
              <span className={styles.subPct}>{isOtp ? "Late%" : "Gap%"}</span>
              <span className={styles.subVehicles}>Buses</span>
            </div>
          </div>
          <div className={styles.list}>
            {isOtp ? (
              otpRouteMetrics.map((rm) => (
                <OtpRouteRow key={`${rm.routeId}:${rm.directionId}`} metrics={rm} onRowClick={() => handleRowClick(rm.routeId, rm.directionId)} />
              ))
            ) : (
              data?.routeMetrics.map((rm) => (
                <RouteMetrics key={`${rm.routeId}:${rm.directionId}`} metrics={rm} onRowClick={() => handleRowClick(rm.routeId, rm.directionId)} />
              ))
            )}
            {!isOtp && !data && <div className={styles.empty}>Loading...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
