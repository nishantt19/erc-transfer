import { useEffect, useCallback, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import { updateEstimate, replaceTransaction } from "@/store/slices/transactionSlice";
import type { CHAIN_ID, TransactionFlow } from "@/types";
import type { InfuraGasResponse } from "@/types/gas";
import { useTransactionEstimation } from "./useTransactionEstimation";
import { truncateHash } from "@/utils/utils";

interface UseTransactionMonitoringProps {
  txFlow: TransactionFlow;
  txHash: `0x${string}` | null;
  gasMetrics: InfuraGasResponse | null | undefined;
  chainId: CHAIN_ID | undefined;
  syncedToast: {
    info: (msg: string, opts?: { description?: string }) => void;
  };
}

export const useTransactionMonitoring = ({
  txFlow,
  txHash,
  gasMetrics,
  chainId,
  syncedToast,
}: UseTransactionMonitoringProps) => {
  const dispatch = useAppDispatch();
  const { estimateTransaction } = useTransactionEstimation();
  const isEstimatingTxRef = useRef<boolean>(false);

  const handleHashChange = useCallback(
    async (newHash: `0x${string}`) => {
      dispatch(replaceTransaction({ newHash }));

      syncedToast.info("Transaction replaced", {
        description: `New hash: ${truncateHash(newHash)}`,
      });

      if (gasMetrics && chainId && !isEstimatingTxRef.current) {
        isEstimatingTxRef.current = true;
        const newEstimate = await estimateTransaction(
          newHash,
          gasMetrics,
          chainId as CHAIN_ID
        );
        if (newEstimate) {
          dispatch(updateEstimate(newEstimate));
        }
        isEstimatingTxRef.current = false;
      }
    },
    [dispatch, gasMetrics, chainId, estimateTransaction, syncedToast]
  );

  useEffect(() => {
    if (
      txFlow.phase === "pending" &&
      !txFlow.estimate &&
      txHash &&
      gasMetrics &&
      chainId &&
      !isEstimatingTxRef.current
    ) {
      isEstimatingTxRef.current = true;
      estimateTransaction(txHash, gasMetrics, chainId as CHAIN_ID).then(
        (estimate) => {
          if (estimate) {
            dispatch(updateEstimate(estimate));
          }
          isEstimatingTxRef.current = false;
        }
      );
    }
  }, [txFlow, txHash, gasMetrics, chainId, estimateTransaction, dispatch]);

  return { handleHashChange };
};
