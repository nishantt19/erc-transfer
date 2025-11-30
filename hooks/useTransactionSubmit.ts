import { useCallback } from "react";
import { sendTransaction, writeContract } from "@wagmi/core";
import { erc20Abi, parseUnits } from "viem";
import { useAppDispatch } from "@/store/hooks";
import {
  startSigning,
  submitTransaction,
} from "@/store/slices/transactionSlice";
import type { TransferFormValues } from "@/schema/transferSchema";
import type { Token } from "@/types";
import { config } from "@/config/wagmi";

interface UseTransactionSubmitProps {
  selectedToken: Token | null;
  syncedToast: {
    loading: (msg: string) => string | undefined;
    dismiss: (id?: string) => void;
    error: (msg: string) => void;
  };
  handleTransactionEstimate: (hash: `0x${string}`) => Promise<void>;
  handleTransactionSuccess: (
    hash: `0x${string}`,
    data: TransferFormValues,
    submittedAt: number
  ) => Promise<void>;
  handleError: (error: Error) => void;
}

export const useTransactionSubmit = ({
  selectedToken,
  syncedToast,
  handleTransactionEstimate,
  handleTransactionSuccess,
  handleError,
}: UseTransactionSubmitProps) => {
  const dispatch = useAppDispatch();

  // Main transaction submission handler - routes to native or ERC20 transfer
  const onSubmit = useCallback(
    async (data: TransferFormValues) => {
      if (!selectedToken) {
        syncedToast.error("No token selected");
        return;
      }

      dispatch(startSigning(undefined));

      let initiatingToastId: string | undefined;

      try {
        // Convert human-readable amount to wei using token decimals
        const amountInWei = parseUnits(data.amount, selectedToken.decimals);
        let hash: `0x${string}`;

        // Native token - use sendTransaction
        if (selectedToken.native_token) {
          initiatingToastId = syncedToast.loading(
            "Initiating Native Token transfer..."
          );
          hash = await sendTransaction(config, {
            to: data.recipient as `0x${string}`,
            value: amountInWei,
          });
        } else {
          // ERC20 token - call transfer function on contract
          initiatingToastId = syncedToast.loading(
            "Initiating ERC20 Token transfer..."
          );
          hash = await writeContract(config, {
            address: selectedToken.token_address,
            abi: erc20Abi,
            functionName: "transfer",
            args: [data.recipient as `0x${string}`, amountInWei],
          });
        }

        if (initiatingToastId) {
          syncedToast.dismiss(initiatingToastId);
        }

        const submittedAt = Date.now();

        dispatch(
          submitTransaction({
            hash,
            submittedAt,
            amount: data.amount,
            recipient: data.recipient,
            tokenSymbol: selectedToken.symbol,
            isNativeToken: !!selectedToken.native_token,
          })
        );

        // Estimate gas and wait for confirmation
        await handleTransactionEstimate(hash);
        await handleTransactionSuccess(hash, data, submittedAt);
      } catch (error) {
        if (initiatingToastId) {
          syncedToast.dismiss(initiatingToastId);
        }
        handleError(error as Error);
      }
    },
    [
      selectedToken,
      dispatch,
      syncedToast,
      handleTransactionEstimate,
      handleTransactionSuccess,
      handleError,
    ]
  );

  return { onSubmit };
};
