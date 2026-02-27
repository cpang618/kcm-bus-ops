import type { CityMetrics as CityMetricsType } from "@bus-ops/shared";
import styles from "./CityMetrics.module.css";

interface CityMetricsProps {
  metrics: CityMetricsType;
  totalVehicles: number;
  excludedCount: number;
}

export function CityMetrics({ metrics, totalVehicles, excludedCount }: CityMetricsProps) {
  const { total, bunchingCount, onTimeCount, gappingCount, bunchingPct, onTimePct, gappingPct } = metrics;

  return (
    <div className={styles.container}>
      <div className={styles.measuredRow}>
        <span className={styles.measuredLabel}>Measured buses</span>
        <span className={styles.measuredCount}>{total.toLocaleString()}</span>
      </div>

      <div className={styles.bar}>
        <div className={styles.barSegment} style={{ width: `${bunchingPct}%`, background: "#E63946" }} title={`Bunching: ${bunchingCount}`} />
        <div className={styles.barSegment} style={{ width: `${onTimePct}%`, background: "#2DC653" }} title={`On time: ${onTimeCount}`} />
        <div className={styles.barSegment} style={{ width: `${gappingPct}%`, background: "#F4A261" }} title={`Gapping: ${gappingCount}`} />
      </div>

      <div className={styles.statsRow}>
        <Stat label="Bunching" count={bunchingCount} pct={bunchingPct} color="#E63946" />
        <Stat label="On Time" count={onTimeCount} pct={onTimePct} color="#2DC653" />
        <Stat label="Gapping" count={gappingCount} pct={gappingPct} color="#F4A261" />
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
              <li>Lead bus (no headway to measure)</li>
              <li>Bus at terminal (layover)</li>
              <li>Bus not yet at first stop</li>
              <li>Bus position unavailable</li>
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
