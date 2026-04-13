import type { OtpRouteMetrics } from "@bus-ops/shared";
import styles from "./RouteMetrics.module.css";

interface OtpRouteRowProps {
  metrics: OtpRouteMetrics;
  onRowClick?: () => void;
}

export function OtpRouteRow({ metrics, onRowClick }: OtpRouteRowProps) {
  const { routeShortName, directionId, vehicleCount, earlyPct, onTimePct, latePct } = metrics;
  const isBad = latePct > 30;

  return (
    <div className={`${styles.row} ${isBad ? styles.bad : ""} ${onRowClick ? styles.clickable : ""}`} onClick={onRowClick}>
      <div className={styles.routeName}>
        {routeShortName}
        <span className={styles.direction}>{directionId === 0 ? "Out" : "In"}</span>
      </div>
      <div className={styles.bar}>
        <div style={{ width: `${earlyPct}%`, background: "#F4A261", height: "100%" }} />
        <div style={{ width: `${onTimePct}%`, background: "#2DC653", height: "100%" }} />
        <div style={{ width: `${latePct}%`, background: "#E63946", height: "100%" }} />
      </div>
      <div className={styles.stats}>
        <span className={styles.pct} style={{ color: latePct > 0 ? "#E63946" : "#555" }}>{latePct.toFixed(0)}%</span>
        <span className={styles.vehicles}>{vehicleCount}v</span>
      </div>
    </div>
  );
}
