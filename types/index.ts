import { type Address } from "viem";

export type Token = {
  token_address: Address;
  name: string;
  symbol: string;
  logo: string | null;
  decimals: number;
  balance?: string;
  usd_price: string;
  native_token?: boolean;
};

export type API_RESPONSE = {
  cursor: string | null;
  page: number;
  page_size: number;
  block_number: number;
  result: Token[];
};

export type CHAIN_ID = 1 | 11155111 | 100 | 8453 | 84532;

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

export type TransactionEstimate = {
  tier: GasTier;
  estimatedWaitTime: number;
  estimatedGasCost: bigint;
  gasUsed: bigint;
};

export type TransactionFlow =
  | { phase: "idle" }
  | { phase: "signing" }
  | {
      phase: "pending";
      hash: `0x${string}`;
      submittedAt: number;
      amount: string;
      recipient: string;
      tokenSymbol: string;
      isNativeToken: boolean;
      estimate: TransactionEstimate | null;
    }
  | {
      phase: "confirmed";
      hash: `0x${string}`;
      blockNumber: bigint;
      submittedAt: number;
      confirmedAt: number;
      completionTimeSeconds: number;
      amount: string;
      recipient: string;
      tokenSymbol: string;
      isNativeToken: boolean;
    };

export type TransactionAction =
  | { type: "START_SIGNING" }
  | {
      type: "SUBMIT_TRANSACTION";
      payload: {
        hash: `0x${string}`;
        submittedAt: number;
        amount: string;
        recipient: string;
        tokenSymbol: string;
        isNativeToken: boolean;
      };
    }
  | { type: "UPDATE_ESTIMATE"; payload: TransactionEstimate }
  | {
      type: "CONFIRM_TRANSACTION";
      payload: {
        blockNumber: bigint;
        confirmedAt: number;
        completionTimeSeconds: number;
      };
    }
  | { type: "RESET" };

export type NetworkCongestionLevel = "low" | "medium" | "high";

export type TransactionStatusType =
  | "idle"
  | "pending"
  | "included"
  | "confirmed";

export type MoralisTokenPriceResponse = {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string | null;
  tokenDecimals: string;
  usdPriceFormatted: string;
  tokenAddress: string;
};
