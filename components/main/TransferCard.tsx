"use client";
import { useEffect, useMemo, useCallback } from "react";
import { shallowEqual } from "react-redux";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetTransaction } from "@/store/slices/transactionSlice";

import type { CHAIN_ID, TransactionFlow } from "@/types";

import { TokenAmountInput, AddressInput } from "@/components/main/input";
import { TransactionEstimation } from "@/components/main/TransactionEstimation";
import { TransactionSuccess } from "@/components/main/TransactionSuccess";
import {
  useTransactionStatus,
  useTransactionReplacement,
  useGasEstimation,
  useGasMetrics,
  useTokenBalance,
  useTransactionEstimation,
  useTransferForm,
  useWalletTokens,
  useToastSync,
  useTransactionHandlers,
  useTransactionMonitoring,
  useGasEstimationEffect,
  useTransactionSubmit,
} from "@/hooks";
import { CHAIN_CONFIG, TIMING_CONSTANTS } from "@/constants";

/**
 * Main transfer component - orchestrates token transfers
 * Handles form state, gas estimation, transaction submission, and monitoring
 */
const TransferCard = () => {
  const { isConnected, chainId, address } = useAccount();
  const { nativeToken, isLoading: isLoadingTokens } = useWalletTokens();
  const dispatch = useAppDispatch();

  // Use shallowEqual to prevent unnecessary rerenders when Redux state changes
  const { txFlow, refetchTrigger, showGasError, isEstimating } = useAppSelector(
    (state) => ({
      txFlow: state.transaction as TransactionFlow,
      refetchTrigger: state.transferForm.refetchTrigger,
      showGasError: state.transferForm.showGasError,
      isEstimating: state.transferForm.isEstimating,
    }),
    shallowEqual
  );

  const syncedToast = useToastSync();

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

  const { status: liveStatus, blockNumber } = useTransactionStatus({
    hash: txHash,
    chainId: chainId as CHAIN_ID | undefined,
  });

  // Poll gas metrics only while transaction is pending and not yet included
  const { gasMetrics } = useGasMetrics(
    txFlow.phase === "pending" && !blockNumber
  );
  const { refetchBalance } = useTokenBalance(selectedToken, undefined);
  const { estimateTransaction } = useTransactionEstimation();
  const { getRequiredGasAmount } = useGasEstimation(gasMetrics ?? undefined);

  const amountValue = watch("amount");
  const recipientValue = watch("recipient");

  const { handleTransactionSuccess, handleError } = useTransactionHandlers({
    selectedToken,
    reset,
    refetchBalance,
    syncedToast,
  });

  const handleTransactionEstimate = useCallback(
    async (hash: `0x${string}`) => {
      if (gasMetrics && chainId) {
        const estimate = await estimateTransaction(
          hash,
          gasMetrics,
          chainId as CHAIN_ID
        );
        if (estimate) {
          dispatch({ type: "transaction/updateEstimate", payload: estimate });
        }
      }
    },
    [gasMetrics, chainId, estimateTransaction, dispatch]
  );

  const { handleHashChange } = useTransactionMonitoring({
    txFlow,
    txHash,
    gasMetrics,
    chainId: chainId as CHAIN_ID | undefined,
    syncedToast,
  });

  // Monitor blocks for transaction replacement (speedup/cancel)
  useTransactionReplacement({
    txHash,
    chainId: chainId as number | undefined,
    enabled: txFlow.phase === "pending",
    onHashChange: handleHashChange,
  });

  // Debounced gas estimation when amount/recipient changes
  useGasEstimationEffect({
    selectedToken,
    amountValue,
    recipientValue,
    address,
    getRequiredGasAmount,
  });

  const { onSubmit } = useTransactionSubmit({
    selectedToken,
    syncedToast,
    handleTransactionEstimate,
    handleTransactionSuccess,
    handleError,
  });

  // Auto-hide success message after delay
  useEffect(() => {
    if (txFlow.phase === "confirmed") {
      const timer = setTimeout(() => {
        dispatch(resetTransaction(undefined));
      }, TIMING_CONSTANTS.AUTO_HIDE_SUCCESS);

      return () => clearTimeout(timer);
    }
  }, [txFlow.phase, dispatch]);

  // Refetch balance when trigger changes
  useEffect(() => {
    if (refetchTrigger > 0) {
      refetchBalance();
    }
  }, [refetchTrigger, refetchBalance]);

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

      {txFlow.phase === "pending" && (
        <TransactionEstimation
          estimate={txFlow.estimate || null}
          startTime={txFlow.submittedAt}
          blockNumber={blockNumber}
          status={liveStatus === "included" ? "included" : "pending"}
          networkCongestion={gasMetrics?.networkCongestion}
          wasReplaced={txFlow.wasReplaced || false}
          currentHash={txFlow.hash}
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
          wasReplaced={txFlow.wasReplaced}
        />
      )}
    </div>
  );
};

export default TransferCard;
