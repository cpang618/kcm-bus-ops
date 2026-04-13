import type { MetricsResponse, MethodBreakdown, OtpBreakdown, ViewMode } from "@bus-ops/shared";
import { useViewMode } from "../../store/viewMode.js";
import { CityMetrics } from "./CityMetrics.js";
import { OtpCityMetrics } from "./OtpCityMetrics.js";
import { MethodDiagnostics } from "./MethodDiagnostics.js";
import { ThresholdSliders } from "../Controls/ThresholdSliders.js";
import { OtpThresholdSliders } from "../Controls/OtpThresholdSliders.js";
import styles from "./MetricsPanel.module.css";

interface MetricsPanelProps {
  data: MetricsResponse | null;
  loading: boolean;
  fetchedAt: string | null;
  isStale: boolean;
  methodBreakdown: MethodBreakdown | null;
  totalVehicles: number;
  excludedCount: number;
  otpCityMetrics: OtpBreakdown | null;
  otpExcludedCount: number;
}

export function MetricsPanel({ data, loading, fetchedAt, isStale, methodBreakdown, totalVehicles, excludedCount, otpCityMetrics, otpExcludedCount }: MetricsPanelProps) {
  const { viewMode, setViewMode } = useViewMode();

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

      <div className={styles.viewToggle}>
        <button className={`${styles.viewPill} ${viewMode === "headway" ? styles.viewPillActive : ""}`} onClick={() => setViewMode("headway")}>Headway</button>
        <button className={`${styles.viewPill} ${viewMode === "otp" ? styles.viewPillActive : ""}`} onClick={() => setViewMode("otp")}>On-Time Perf</button>
      </div>

      {loading && !data && (
        <div className={styles.loading}>Loading...</div>
      )}

      {viewMode === "headway" && (
        <>
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
        </>
      )}

      {viewMode === "otp" && otpCityMetrics && (
        <>
          <OtpCityMetrics metrics={otpCityMetrics} totalVehicles={totalVehicles} excludedCount={otpExcludedCount} />
          <div className={styles.divider} />
          <OtpThresholdSliders />
        </>
      )}
    </div>
  );
}
