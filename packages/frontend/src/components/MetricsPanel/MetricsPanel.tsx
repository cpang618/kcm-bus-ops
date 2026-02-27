import type { MetricsResponse, MethodBreakdown } from "@bus-ops/shared";
import { CityMetrics } from "./CityMetrics.js";
import { MethodDiagnostics } from "./MethodDiagnostics.js";
import { ThresholdSliders } from "../Controls/ThresholdSliders.js";
import styles from "./MetricsPanel.module.css";

interface MetricsPanelProps {
  data: MetricsResponse | null;
  loading: boolean;
  fetchedAt: string | null;
  isStale: boolean;
  methodBreakdown: MethodBreakdown | null;
  totalVehicles: number;
  excludedCount: number;
}

export function MetricsPanel({ data, loading, fetchedAt, isStale, methodBreakdown, totalVehicles, excludedCount }: MetricsPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Bus Operations</span>
        {fetchedAt && (
          <span className={`${styles.timestamp} ${isStale ? styles.stale : ""}`}>
            {isStale ? "\u26a0 Stale \u00b7 " : "Live "}
            {new Date(fetchedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className={styles.attribution}>
        Created by{" "}
        <a
          href="https://www.linkedin.com/in/cpang/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.attributionLink}
        >
          Chris Pangilinan
        </a>
        {" "}&copy; 2026
        <br />
        GTFS data from{" "}
        <a
          href="https://kingcounty.gov/en/dept/metro/rider-tools/mobile-and-web-apps#toc-developer-resources"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.attributionLink}
        >
          King County Metro
        </a>
      </div>

      {loading && !data && (
        <div className={styles.loading}>Loading...</div>
      )}

      {methodBreakdown && (
        <MethodDiagnostics breakdown={methodBreakdown} />
      )}

      {data && (
        <>
          <CityMetrics metrics={data.cityMetrics} totalVehicles={totalVehicles} excludedCount={excludedCount} />
          <div className={styles.divider} />
          <ThresholdSliders />
        </>
      )}
    </div>
  );
}
