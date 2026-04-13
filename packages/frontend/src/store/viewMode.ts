import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  createElement,
} from "react";
import type { ViewMode, OtpThresholdParams } from "@bus-ops/shared";
import { DEFAULT_OTP_THRESHOLDS } from "@bus-ops/shared";

interface ViewModeContextValue {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  otpThresholds: OtpThresholdParams;
  updateOtpThreshold: <K extends keyof OtpThresholdParams>(key: K, value: OtpThresholdParams[K]) => void;
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("headway");
  const [otpThresholds, setOtpThresholds] = useState<OtpThresholdParams>(DEFAULT_OTP_THRESHOLDS);

  const updateOtpThreshold = useCallback(
    <K extends keyof OtpThresholdParams>(key: K, value: OtpThresholdParams[K]) => {
      setOtpThresholds((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return createElement(
    ViewModeContext.Provider,
    { value: { viewMode, setViewMode, otpThresholds, updateOtpThreshold } },
    children,
  );
}

export function useViewMode(): ViewModeContextValue {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}
