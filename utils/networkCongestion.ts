import type { NetworkCongestionLevel } from "@/types";

const CONGESTION_COLORS: Record<NetworkCongestionLevel, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
};

const CONGESTION_LABELS: Record<NetworkCongestionLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const getNetworkCongestionLevel = (
  congestion: number
): NetworkCongestionLevel => {
  if (congestion < 0.33) return "low";
  if (congestion < 0.66) return "medium";
  return "high";
};

export const getCongestionColor = (level: NetworkCongestionLevel): string =>
  CONGESTION_COLORS[level];

export const getCongestionLabel = (level: NetworkCongestionLevel): string =>
  CONGESTION_LABELS[level];
