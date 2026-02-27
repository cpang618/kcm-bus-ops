import type { RouteMetrics as RouteMetricsType } from "@bus-ops/shared";
import styles from "./RouteMetrics.module.css";

interface RouteMetricsProps {
  metrics: RouteMetricsType;
  onRowClick?: () => void;
}

export function RouteMetrics({ metrics, onRowClick }: RouteMetricsProps) {
  const { routeShortName, directionId, vehicleCount, bunchingPct, onTimePct, gappingPct } = metrics;
  const isBad = gappingPct > 30;

  return (
    <div className={`${styles.row} ${isBad ? styles.bad : ""} ${onRowClick ? styles.clickable : ""}`} onClick={onRowClick}>
      <div className={styles.routeName}>
        {routeShortName}
        <span className={styles.direction}>{directionId === 0 ? "Out" : "In"}</span>
      </div>
      <div className={styles.bar}>
        <div style={{ width: `${bunchingPct}%`, background: "#E63946", height: "100%" }} />
        <div style={{ width: `${onTimePct}%`, background: "#2DC653", height: "100%" }} />
        <div style={{ width: `${gappingPct}%`, background: "#F4A261", height: "100%" }} />
      </div>
      <div className={styles.stats}>
        <span className={styles.pct} style={{ color: gappingPct > 0 ? "#F4A261" : "#555" }}>{gappingPct.toFixed(0)}%</span>
        <span className={styles.vehicles}>{vehicleCount}v</span>
      </div>
    </div>
  );
}
