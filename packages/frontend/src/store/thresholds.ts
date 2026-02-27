import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  createElement,
} from "react";
import type { ThresholdParams } from "@bus-ops/shared";
import { DEFAULT_THRESHOLDS } from "@bus-ops/shared";

interface ThresholdContextValue {
  thresholds: ThresholdParams;
  setThresholds: (t: ThresholdParams) => void;
  updateThreshold: <K extends keyof ThresholdParams>(key: K, value: ThresholdParams[K]) => void;
}

const ThresholdContext = createContext<ThresholdContextValue | null>(null);

export function ThresholdProvider({ children }: { children: ReactNode }) {
  const [thresholds, setThresholds] = useState<ThresholdParams>(DEFAULT_THRESHOLDS);

  const updateThreshold = useCallback(
    <K extends keyof ThresholdParams>(key: K, value: ThresholdParams[K]) => {
      setThresholds((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return createElement(
    ThresholdContext.Provider,
    { value: { thresholds, setThresholds, updateThreshold } },
    children,
  );
}

export function useThresholds(): ThresholdContextValue {
  const ctx = useContext(ThresholdContext);
  if (!ctx) throw new Error("useThresholds must be used within ThresholdProvider");
  return ctx;
}
