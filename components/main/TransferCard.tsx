"use client";
import { useReducer, useEffect, useCallback, useRef, useMemo } from "react";
import { useAccount } from "wagmi";
import {
  sendTransaction,
  writeContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { erc20Abi, parseUnits } from "viem";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import type { TransferFormValues } from "@/schema/transferSchema";
import type { CHAIN_ID, TransactionFlow } from "@/types";

import { TokenAmountInput, AddressInput } from "@/components/main/input";
import { TransactionEstimation } from "@/components/main/TransactionEstimation";
import { TransactionSuccess } from "@/components/main/TransactionSuccess";
import {
  useTransactionStatus,
  useGasEstimation,
  useGasMetrics,
  useTokenBalance,
  useTransactionEstimation,
  useTransferForm,
  useWalletTokens,
} from "@/hooks";
import { config } from "@/config/wagmi";
import { truncateHash } from "@/utils/utils";
import { CHAIN_CONFIG } from "@/utils/constants";
import { transactionReducer } from "@/utils/transactionReducer";

const AUTO_HIDE_DELAY = 10000;

const TransferCard = () => {
  const { isConnected, chainId, address } = useAccount();
  const { nativeToken, isLoading: isLoadingTokens } = useWalletTokens();
  const [txFlow, dispatch] = useReducer(transactionReducer, { phase: "idle" });

  const isProcessing = txFlow.phase !== "idle";
  const txHash =
    txFlow.phase === "pending" || txFlow.phase === "confirmed"
      ? txFlow.hash
      : null;

  const {
    token,
    handleTokenSelect,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
    getValues,
    control,
    reset,
    watch,
  } = useTransferForm({ initialToken: nativeToken });

  const selectedToken = isConnected ? token : null;
  const { gasMetrics } = useGasMetrics();
  const { refetchBalance } = useTokenBalance(selectedToken, undefined);
  const { estimateTransaction } = useTransactionEstimation();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { getRequiredGasAmount, showGasError, isEstimating } =
    useGasEstimation();

  const { status: liveStatus, blockNumber } = useTransactionStatus({
    hash: txHash,
    chainId: chainId as CHAIN_ID | undefined,
  });

  const amountValue = watch("amount");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (selectedToken && amountValue) {
      debounceRef.current = setTimeout(() => {
        getRequiredGasAmount(
          selectedToken,
          parseUnits(amountValue, selectedToken.decimals),
          (getValues("recipient") as `0x${string}`) || address
        );
      }, 500);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amountValue, selectedToken, getRequiredGasAmount, getValues, address]);

  useEffect(() => {
    if (!isConnected) {
      dispatch({ type: "RESET" });
      reset();
    }
  }, [isConnected, reset]);

  useEffect(() => {
    if (txFlow.phase === "confirmed") {
      const timer = setTimeout(() => {
        dispatch({ type: "RESET" });
      }, AUTO_HIDE_DELAY);

      return () => clearTimeout(timer);
    }
  }, [txFlow.phase]);

  const handleTransactionSuccess = useCallback(
    async (
      hash: `0x${string}`,
      data: TransferFormValues,
      submittedAt: number
    ) => {
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 2,
      });

      const confirmedAt = Date.now();
      const completionTimeSeconds = Math.floor(
        (confirmedAt - submittedAt) / 1000
      );

      console.log("Transaction completed:", {
        submittedAt,
        confirmedAt,
        completionTimeSeconds,
      });

      toast.dismiss();

      if (receipt.status === "success") {
        dispatch({
          type: "CONFIRM_TRANSACTION",
          payload: {
            blockNumber: receipt.blockNumber,
            confirmedAt,
            completionTimeSeconds,
          },
        });

        toast.success("Transfer successful!", {
          description: `Sent ${data.amount} ${
            selectedToken!.symbol
          } to ${data.recipient.slice(0, 6)}...${data.recipient.slice(-4)}`,
        });

        reset({
          amount: "",
          recipient: "",
          tokenAddress: selectedToken!.token_address,
        });

        await refetchBalance();
      } else {
        toast.error("Transaction failed", {
          description: "The transaction was reverted",
        });
        dispatch({ type: "RESET" });
      }
    },
    [selectedToken, reset, refetchBalance]
  );

  const handleTransactionEstimate = useCallback(
    async (hash: `0x${string}`) => {
      if (gasMetrics && chainId) {
        const estimate = await estimateTransaction(
          hash,
          gasMetrics,
          chainId as CHAIN_ID
        );
        if (estimate) {
          dispatch({
            type: "UPDATE_ESTIMATE",
            payload: estimate,
          });
          toast.loading("Transaction pending...", {
            description: `Hash: ${truncateHash(
              hash
            )}\nEstimated time: ~${Math.floor(
              estimate.estimatedWaitTime / 1000
            )}s`,
          });
        } else {
          toast.loading("Transaction pending...", {
            description: `Hash: ${truncateHash(hash)}`,
          });
        }
      } else {
        toast.loading("Transaction pending...", {
          description: `Hash: ${truncateHash(hash)}`,
        });
      }
    },
    [gasMetrics, chainId, estimateTransaction]
  );

  const handleError = useCallback(
    (error: Error & { message?: string }) => {
      toast.dismiss();
      dispatch({ type: "RESET" });

      if (error?.message?.includes("User rejected")) {
        toast.error("Transaction rejected", {
          description: "You rejected the transaction in your wallet",
        });
      } else if (error?.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds", {
          description: selectedToken?.native_token
            ? "You don't have enough balance to cover the transfer and gas fees"
            : "You don't have enough balance for this transfer or gas fees",
        });
      } else if (error?.message?.includes("gas")) {
        toast.error("Gas estimation failed", {
          description: "Unable to estimate gas for this transaction",
        });
      } else {
        toast.error("Transfer failed", {
          description: error?.message || "An unknown error occurred",
        });
      }

      console.error("Transfer error:", error);
    },
    [selectedToken]
  );

  const onSubmit = useCallback(
    async (data: TransferFormValues) => {
      if (!selectedToken) {
        toast.error("No token selected");
        return;
      }

      dispatch({ type: "START_SIGNING" });

      try {
        const amountInWei = parseUnits(data.amount, selectedToken.decimals);
        let hash: `0x${string}`;

        if (selectedToken.native_token) {
          toast.loading("Initiating Native Token transfer...");
          hash = await sendTransaction(config, {
            to: data.recipient as `0x${string}`,
            value: amountInWei,
          });
        } else {
          toast.loading("Initiating ERC20 Token transfer...");
          hash = await writeContract(config, {
            address: selectedToken.token_address,
            abi: erc20Abi,
            functionName: "transfer",
            args: [data.recipient as `0x${string}`, amountInWei],
          });
        }

        toast.dismiss();

        const submittedAt = Date.now();

        dispatch({
          type: "SUBMIT_TRANSACTION",
          payload: {
            hash,
            submittedAt,
            amount: data.amount,
            recipient: data.recipient,
            tokenSymbol: selectedToken.symbol,
            isNativeToken: selectedToken.native_token,
          },
        });

        await handleTransactionEstimate(hash);
        await handleTransactionSuccess(hash, data, submittedAt);
      } catch (error) {
        handleError(error as Error);
      }
    },
    [
      selectedToken,
      handleTransactionEstimate,
      handleTransactionSuccess,
      handleError,
    ]
  );

  const getButtonText = useMemo(() => {
    if (!isConnected) return "Connect Wallet to Continue";
    if (isLoadingTokens) return "Loading Tokens...";
    if (isEstimating) return "Estimating Gas Fee";
    if (showGasError) return `Not Enough ${nativeToken?.symbol || "ETH"}`;

    const phaseText: Record<TransactionFlow["phase"], string> = {
      idle: "Send Tokens",
      signing: "Confirm in Wallet...",
      pending: "Transaction Pending...",
      confirmed: "Transaction Confirmed",
    };

    return phaseText[txFlow.phase];
  }, [
    isConnected,
    isLoadingTokens,
    isEstimating,
    showGasError,
    nativeToken?.symbol,
    txFlow.phase,
  ]);

  return (
    <div className="w-full flex flex-col gap-y-0">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full bg-card rounded-3xl p-2.5 flex flex-col gap-y-2.5"
      >
        <div className="flex flex-col gap-y-2">
          <TokenAmountInput
            label="Amount"
            placeholder="0"
            register={register("amount")}
            error={errors.amount?.message}
            selectedToken={selectedToken}
            onTokenSelect={handleTokenSelect}
            setValue={setValue}
            fieldName="amount"
            getValues={getValues}
            control={control}
          />
          <AddressInput
            label="Recipient Address"
            placeholder="0x..."
            register={register("recipient")}
            error={errors.recipient?.message}
          />
        </div>
        <motion.button
          disabled={
            !isConnected ||
            isLoadingTokens ||
            isProcessing ||
            isEstimating ||
            !!showGasError
          }
          className="py-4 px-5 rounded-2xl bg-primary hover:bg-primary/90 disabled:bg-primary/60 disabled:cursor-not-allowed text-foreground text-lg font-semibold cursor-pointer"
          animate={{
            opacity:
              !isConnected ||
              isLoadingTokens ||
              isProcessing ||
              isEstimating ||
              showGasError
                ? 0.6
                : 1,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {getButtonText}
        </motion.button>
      </form>

      <AnimatePresence>
        {showGasError && isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full rounded-2xl p-4 mt-2 gap-y-3 text-sm border-2 border-destructive/50 bg-card/50"
          >
            <span className="font-semibold text-destructive">ERROR: </span>Not
            Enough{" "}
            <span className="text-accent-blue font-semibold">
              {nativeToken?.symbol || "ETH"} on{" "}
              {CHAIN_CONFIG[chainId || 1].NAME}
            </span>{" "}
            to cover gas fees.
          </motion.div>
        )}
      </AnimatePresence>

      {txFlow.phase === "pending" && txFlow.estimate && (
        <TransactionEstimation
          estimate={txFlow.estimate}
          startTime={txFlow.submittedAt}
          blockNumber={blockNumber}
          status={liveStatus === "included" ? "included" : "pending"}
          networkCongestion={gasMetrics?.networkCongestion}
        />
      )}

      {txFlow.phase === "confirmed" && chainId && (
        <TransactionSuccess
          hash={txFlow.hash}
          amount={txFlow.amount}
          tokenSymbol={txFlow.tokenSymbol}
          completionTimeSeconds={txFlow.completionTimeSeconds}
          isNativeToken={txFlow.isNativeToken}
          chainId={chainId as CHAIN_ID}
        />
      )}
    </div>
  );
};

export default TransferCard;
