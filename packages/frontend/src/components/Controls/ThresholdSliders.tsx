import { useThresholds } from "../../store/thresholds.js";
import styles from "./ThresholdSliders.module.css";

export function ThresholdSliders() {
  const { thresholds, updateThreshold } = useThresholds();
  const { mode, bunchingPct, gappingPct, bunchingMins, gappingMins } = thresholds;

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.title}>Thresholds</span>
        <div className={styles.modeToggle}>
          <button className={`${styles.modeBtn} ${mode === "pct" ? styles.active : ""}`} onClick={() => updateThreshold("mode", "pct")}>% of scheduled</button>
          <button className={`${styles.modeBtn} ${mode === "abs" ? styles.active : ""}`} onClick={() => updateThreshold("mode", "abs")}>Minutes</button>
        </div>
      </div>

      {mode === "pct" && (
        <div className={styles.sliders}>
          <SliderRow label="Bunching if below" value={bunchingPct} min={10} max={50} step={5} unit="%" color="#E63946" onChange={(v) => updateThreshold("bunchingPct", v)} />
          <SliderRow label="Gapping if above" value={gappingPct} min={100} max={200} step={10} unit="%" color="#F4A261" onChange={(v) => updateThreshold("gappingPct", v)} />
          <div className={styles.hint}>On-time: {bunchingPct}% &ndash; {gappingPct}% of scheduled headway</div>
        </div>
      )}

      {mode === "abs" && (
        <div className={styles.sliders}>
          <SliderRow label="Bunching if below" value={bunchingMins} min={0.5} max={15} step={0.5} unit="min" color="#E63946" onChange={(v) => updateThreshold("bunchingMins", v)} />
          <SliderRow label="Gapping if above" value={gappingMins} min={2} max={60} step={1} unit="min" color="#F4A261" onChange={(v) => updateThreshold("gappingMins", v)} />
          <div className={styles.hint}>On-time: {bunchingMins}min &ndash; {gappingMins}min headway</div>
        </div>
      )}
    </div>
  );
}

interface SliderRowProps { label: string; value: number; min: number; max: number; step: number; unit: string; color: string; onChange: (value: number) => void; }

function SliderRow({ label, value, min, max, step, unit, color, onChange }: SliderRowProps) {
  return (
    <div className={styles.sliderRow}>
      <div className={styles.sliderLabel}>
        <span>{label}</span>
        <span style={{ color }} className={styles.sliderValue}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} className={styles.slider} style={{ "--slider-color": color } as React.CSSProperties} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}
