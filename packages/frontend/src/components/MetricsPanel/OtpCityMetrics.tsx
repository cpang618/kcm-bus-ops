import type { OtpBreakdown } from "@bus-ops/shared";
import styles from "./CityMetrics.module.css";

interface OtpCityMetricsProps {
  metrics: OtpBreakdown;
  totalVehicles: number;
  excludedCount: number;
}

export function OtpCityMetrics({ metrics, totalVehicles, excludedCount }: OtpCityMetricsProps) {
  const { total, earlyCount, onTimeCount, lateCount, earlyPct, onTimePct, latePct } = metrics;

  return (
    <div className={styles.container}>
      <div className={styles.measuredRow}>
        <span className={styles.measuredLabel}>Measured buses</span>
        <span className={styles.measuredCount}>{total.toLocaleString()}</span>
      </div>

      <div className={styles.bar}>
        <div className={styles.barSegment} style={{ width: `${earlyPct}%`, background: "#F4A261" }} title={`Early: ${earlyCount}`} />
        <div className={styles.barSegment} style={{ width: `${onTimePct}%`, background: "#2DC653" }} title={`On time: ${onTimeCount}`} />
        <div className={styles.barSegment} style={{ width: `${latePct}%`, background: "#E63946" }} title={`Late: ${lateCount}`} />
      </div>

      <div className={styles.statsRow}>
        <Stat label="Early" count={earlyCount} pct={earlyPct} color="#F4A261" />
        <Stat label="On Time" count={onTimeCount} pct={onTimePct} color="#2DC653" />
        <Stat label="Late" count={lateCount} pct={latePct} color="#E63946" />
      </div>

      <div className={styles.pollSummary}>
        <div className={styles.pollRow}>
          <span>Total buses polled</span>
          <span className={styles.pollCount}>{totalVehicles.toLocaleString()}</span>
        </div>
        {excludedCount > 0 && (
          <div className={styles.excludedBlock}>
            <div className={styles.pollRow}>
              <span>Buses excluded</span>
              <span className={styles.pollCount}>{excludedCount.toLocaleString()}</span>
            </div>
            <ul className={styles.excludedReasons}>
              <li>Bus at terminal (layover)</li>
              <li>No schedule data available</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statDot} style={{ background: color }} />
      <div>
        <div className={styles.statPct}>{pct.toFixed(1)}%</div>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statCount}>{count}</div>
      </div>
    </div>
  );
}
