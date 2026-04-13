import { useViewMode } from "../../store/viewMode.js";
import styles from "./ThresholdSliders.module.css";

export function OtpThresholdSliders() {
  const { otpThresholds, updateOtpThreshold } = useViewMode();
  const earlyMins = Math.abs(otpThresholds.earlyThresholdSecs) / 60;
  const lateMins = otpThresholds.lateThresholdSecs / 60;

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.title}>Thresholds</span>
      </div>
      <div className={styles.sliders}>
        <SliderRow
          label="Early if more than"
          value={earlyMins}
          min={0.5}
          max={5}
          step={0.5}
          unit="min early"
          color="#F4A261"
          onChange={(v) => updateOtpThreshold("earlyThresholdSecs", -(v * 60))}
        />
        <SliderRow
          label="Late if more than"
          value={lateMins}
          min={1}
          max={15}
          step={0.5}
          unit="min late"
          color="#E63946"
          onChange={(v) => updateOtpThreshold("lateThresholdSecs", v * 60)}
        />
        <div className={styles.hint}>On-time: up to {earlyMins}min early through {lateMins}min late</div>
      </div>
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
