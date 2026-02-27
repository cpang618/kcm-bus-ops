import { useState, useCallback } from "react";
import type { MetricsResponse } from "@bus-ops/shared";
import { useMap } from "../Map/MapView.js";
import { RouteMetrics } from "../MetricsPanel/RouteMetrics.js";
import styles from "./RoutesPanel.module.css";

interface RoutesPanelProps {
  data: MetricsResponse | null;
  routeFeatures: GeoJSON.Feature[];
}

export function RoutesPanel({ data, routeFeatures }: RoutesPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const map = useMap();

  const handleRowClick = useCallback(
    (routeId: string, directionId: 0 | 1) => {
      if (!map) return;
      const feature = routeFeatures.find(
        (f) => f.properties?.routeId === routeId && f.properties?.directionId === directionId,
      );
      if (!feature || feature.geometry.type !== "LineString") return;
      const [lng, lat] = (feature.geometry as GeoJSON.LineString).coordinates[0];
      map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
    },
    [map, routeFeatures],
  );

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>Routes &mdash; sorted by gapping</span>
          <button className={styles.collapseBtn} onClick={() => setIsOpen((o) => !o)} title={isOpen ? "Collapse" : "Expand"}>
            {isOpen ? "\u25b2" : "\u25bc"}
          </button>
        </div>

        <div className={`${styles.body} ${isOpen ? styles.bodyOpen : ""}`}>
          <div className={styles.subheader}>
            <span className={styles.subRoute}>Route</span>
            <span className={styles.subBar} />
            <div className={styles.subStats}>
              <span className={styles.subPct}>Gap%</span>
              <span className={styles.subVehicles}>Buses</span>
            </div>
          </div>
          <div className={styles.list}>
            {data?.routeMetrics.map((rm) => (
              <RouteMetrics key={`${rm.routeId}:${rm.directionId}`} metrics={rm} onRowClick={() => handleRowClick(rm.routeId, rm.directionId)} />
            ))}
            {!data && <div className={styles.empty}>Loading...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
