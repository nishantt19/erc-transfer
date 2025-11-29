import { useCallback } from "react";

import type { InfuraGasResponse, TransactionEstimate, CHAIN_ID } from "@/types";
import { fetchTransactionWithRetry } from "@/utils/transactionHelpers";
import { detectGasTier } from "@/utils/gasCalculations";

export const useTransactionEstimation = () => {
  const estimateTransaction = useCallback(
    async (
      txHash: `0x${string}`,
      gasMetrics: InfuraGasResponse,
      chainId: CHAIN_ID
    ): Promise<TransactionEstimate | null> => {
      try {
        const transaction = await fetchTransactionWithRetry(txHash, chainId);
        if (!transaction) {
          console.error("Transaction not found after retries");
          return null;
        }

        const actualMaxPriorityFee =
          transaction.maxPriorityFeePerGas || transaction.gasPrice || BigInt(0);
        const actualMaxFee =
          transaction.maxFeePerGas || transaction.gasPrice || BigInt(0);

        const tier = detectGasTier(
          actualMaxPriorityFee,
          actualMaxFee,
          gasMetrics
        );
        const estimatedWaitTime = gasMetrics[tier].maxWaitTimeEstimate;

        const gasLimit = transaction.gas;
        const estimatedGasCost = gasLimit * actualMaxFee;

        return {
          tier,
          estimatedWaitTime,
          estimatedGasCost,
          gasUsed: gasLimit,
        };
      } catch (error) {
        console.error("Error estimating transaction:", error);
        return null;
      }
    },
    []
  );

  return {
    estimateTransaction,
  };
};
