import type { MethodBreakdown } from "@bus-ops/shared";
import styles from "./MethodDiagnostics.module.css";

interface MethodDiagnosticsProps {
  breakdown: MethodBreakdown;
}

export function MethodDiagnostics({ breakdown }: MethodDiagnosticsProps) {
  const { etaCount, distanceCount, etaPct, distancePct } = breakdown;
  const total = etaCount + distanceCount;

  return (
    <div className={styles.container}>
      <div className={styles.header}>Headway Method</div>
      <MethodRow label="Live predictions" sublabel="ETA" count={etaCount} pct={etaPct} color="#2DC653" />
      <MethodRow label="Distance estimate" sublabel="DIST" count={distanceCount} pct={distancePct} color="#F4A261" />
      <div className={styles.footer}>{total.toLocaleString()} pairs measured</div>
    </div>
  );
}

interface MethodRowProps { label: string; sublabel: string; count: number; pct: number; color: string; }

function MethodRow({ label, sublabel, count, pct, color }: MethodRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.badge} style={{ color, borderColor: `${color}40` }}>{sublabel}</span>
      <span className={styles.label}>{label}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.pct} style={{ color }}>{pct.toFixed(0)}%</span>
      <span className={styles.count}>{count.toLocaleString()}</span>
    </div>
  );
}
