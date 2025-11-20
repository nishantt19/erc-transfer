import { parseGwei } from "viem";
import type { InfuraGasResponse, GasTier } from "@/types";

export const detectGasTier = (
  txMaxPriorityFee: bigint,
  txMaxFee: bigint,
  gasMetrics: InfuraGasResponse
): GasTier => {
  const tierPriorityFees = {
    low: parseGwei(gasMetrics.low.suggestedMaxPriorityFeePerGas),
    medium: parseGwei(gasMetrics.medium.suggestedMaxPriorityFeePerGas),
    high: parseGwei(gasMetrics.high.suggestedMaxPriorityFeePerGas),
  };

  const tierMaxFees = {
    low: parseGwei(gasMetrics.low.suggestedMaxFeePerGas),
    medium: parseGwei(gasMetrics.medium.suggestedMaxFeePerGas),
    high: parseGwei(gasMetrics.high.suggestedMaxFeePerGas),
  };

  if (txMaxPriorityFee <= tierPriorityFees.low) return "low";
  if (txMaxPriorityFee <= tierPriorityFees.medium) return "medium";
  if (txMaxPriorityFee <= tierPriorityFees.high) return "high";
  if (txMaxFee <= tierMaxFees.low) return "low";
  if (txMaxFee <= tierMaxFees.medium) return "medium";

  return "high";
};

export const GAS_TIER_LABELS: Record<GasTier, string> = {
  low: "Low Priority",
  medium: "Medium Priority",
  high: "High Priority",
};
