import { GasTier } from "./gas";

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
      wasReplaced?: boolean;
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
      wasReplaced?: boolean;
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
      type: "REPLACE_TRANSACTION";
      payload: {
        newHash: `0x${string}`;
      };
    }
  | {
      type: "CONFIRM_TRANSACTION";
      payload: {
        blockNumber: bigint;
        confirmedAt: number;
        completionTimeSeconds: number;
      };
    }
  | { type: "RESET" };

export type TransactionStatusType =
  | "idle"
  | "pending"
  | "included"
  | "confirmed";
