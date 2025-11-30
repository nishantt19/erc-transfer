import { useCallback } from "react";
import { waitForTransactionReceipt } from "@wagmi/core";
import { useAppDispatch } from "@/store/hooks";
import { confirmTransaction, resetTransaction } from "@/store/slices/transactionSlice";
import { resetForm, triggerBalanceRefetch } from "@/store/slices/transferFormSlice";
import type { TransferFormValues } from "@/schema/transferSchema";
import type { Token } from "@/types";
import { config } from "@/config/wagmi";

interface UseTransactionHandlersProps {
  selectedToken: Token | null;
  reset: (values: Partial<TransferFormValues>) => void;
  refetchBalance: () => Promise<void>;
  syncedToast: {
    success: (msg: string, opts?: { description?: string }) => void;
    error: (msg: string, opts?: { description?: string }) => void;
  };
}

export const useTransactionHandlers = ({
  selectedToken,
  reset,
  refetchBalance,
  syncedToast,
}: UseTransactionHandlersProps) => {
  const dispatch = useAppDispatch();

  // Handle post-transaction confirmation logic
  const handleTransactionSuccess = useCallback(
    async (
      hash: `0x${string}`,
      data: TransferFormValues,
      submittedAt: number
    ) => {
      // Wait for 2 confirmations to ensure finality and prevent reorg issues
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 2,
      });

      const confirmedAt = Date.now();
      const completionTimeSeconds = Math.floor(
        (confirmedAt - submittedAt) / 1000
      );

      if (receipt.status === "success") {
        dispatch(
          confirmTransaction({
            blockNumber: receipt.blockNumber,
            confirmedAt,
            completionTimeSeconds,
          })
        );

        syncedToast.success("Transfer successful!", {
          description: `Sent ${data.amount} ${
            selectedToken!.symbol
          } to ${data.recipient.slice(0, 6)}...${data.recipient.slice(-4)}`,
        });

        // Reset form while preserving token selection
        reset({
          amount: "",
          recipient: "",
          tokenAddress: selectedToken!.token_address,
        });

        dispatch(resetForm());

        // Refresh balance to reflect new state
        await refetchBalance();
        dispatch(triggerBalanceRefetch());
      } else {
        syncedToast.error("Transaction failed", {
          description: "The transaction was reverted",
        });
        dispatch(resetTransaction(undefined));
      }
    },
    [selectedToken, reset, refetchBalance, dispatch, syncedToast]
  );

  // Provide user-friendly error messages based on error type
  const handleError = useCallback(
    (error: Error & { message?: string }) => {
      dispatch(resetTransaction(undefined));

      if (error?.message?.includes("User rejected")) {
        syncedToast.error("Transaction rejected", {
          description: "You rejected the transaction in your wallet",
        });
      } else if (error?.message?.includes("insufficient funds")) {
        syncedToast.error("Insufficient funds", {
          description: selectedToken?.native_token
            ? "You don't have enough balance to cover the transfer and gas fees"
            : "You don't have enough balance for this transfer or gas fees",
        });
      } else if (error?.message?.includes("gas")) {
        syncedToast.error("Gas estimation failed", {
          description: "Unable to estimate gas for this transaction",
        });
      } else {
        syncedToast.error("Transfer failed", {
          description: error?.message || "An unknown error occurred",
        });
      }

      console.error("Transfer error:", error);
    },
    [selectedToken, dispatch, syncedToast]
  );

  return { handleTransactionSuccess, handleError };
};
