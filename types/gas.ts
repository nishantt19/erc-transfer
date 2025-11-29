export type GasTier = "low" | "medium" | "high";

export type GasFeeEstimate = {
  suggestedMaxPriorityFeePerGas: string;
  suggestedMaxFeePerGas: string;
  minWaitTimeEstimate: number;
  maxWaitTimeEstimate: number;
};

export type InfuraGasResponse = {
  low: GasFeeEstimate;
  medium: GasFeeEstimate;
  high: GasFeeEstimate;
  estimatedBaseFee: string;
  networkCongestion: number;
  latestPriorityFeeRange: [string, string];
  historicalPriorityFeeRange: [string, string];
  historicalBaseFeeRange: [string, string];
  priorityFeeTrend: "up" | "down";
  baseFeeTrend: "up" | "down";
};
