"use client";
import { useEffect, useCallback, useRef, useMemo } from "react";
import { useAccount } from "wagmi";
import {
  sendTransaction,
  writeContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { erc20Abi, parseUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetForm,
  triggerBalanceRefetch,
} from "@/store/slices/transferFormSlice";
import {
  startSigning,
  submitTransaction,
  updateEstimate,
  replaceTransaction,
  confirmTransaction,
  resetTransaction,
} from "@/store/slices/transactionSlice";

import type { TransferFormValues } from "@/schema/transferSchema";
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
} from "@/hooks";
import { config } from "@/config/wagmi";
import { truncateHash } from "@/utils/utils";
import { CHAIN_CONFIG, TIMING_CONSTANTS } from "@/constants";

const TransferCard = () => {
  const { isConnected, chainId, address } = useAccount();
  const { nativeToken, isLoading: isLoadingTokens } = useWalletTokens();
  const dispatch = useAppDispatch();
  const txFlow = useAppSelector(
    (state) => state.transaction
  ) as TransactionFlow;
  const refetchTrigger = useAppSelector(
    (state) => state.transferForm.refetchTrigger
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
  const { gasMetrics } = useGasMetrics();
  const { refetchBalance } = useTokenBalance(selectedToken, undefined);
  const { estimateTransaction } = useTransactionEstimation();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { getRequiredGasAmount } = useGasEstimation();
  const showGasError = useAppSelector(
    (state) => state.transferForm.showGasError
  );
  const isEstimating = useAppSelector(
    (state) => state.transferForm.isEstimating
  );

  const { status: liveStatus, blockNumber } = useTransactionStatus({
    hash: txHash,
    chainId: chainId as CHAIN_ID | undefined,
  });

  useTransactionReplacement({
    txHash,
    chainId: chainId as number | undefined,
    enabled: txFlow.phase === "pending",
    onHashChange: useCallback(
      async (newHash: `0x${string}`) => {
        dispatch(replaceTransaction({ newHash }));

        syncedToast.info("Transaction replaced", {
          description: `New hash: ${truncateHash(newHash)}`,
        });

        if (gasMetrics && chainId) {
          const newEstimate = await estimateTransaction(
            newHash,
            gasMetrics,
            chainId as CHAIN_ID
          );
          if (newEstimate) {
            dispatch(updateEstimate(newEstimate));
          }
        }
      },
      [dispatch, gasMetrics, chainId, estimateTransaction, syncedToast]
    ),
  });

  useEffect(() => {
    if (
      txFlow.phase === "pending" &&
      !txFlow.estimate &&
      txHash &&
      gasMetrics &&
      chainId
    ) {
      estimateTransaction(txHash, gasMetrics, chainId as CHAIN_ID).then(
        (estimate) => {
          if (estimate) {
            dispatch(updateEstimate(estimate));
          }
        }
      );
    }
  }, [txFlow, txHash, gasMetrics, chainId, estimateTransaction, dispatch]);

  const amountValue = watch("amount");
  const recipientValue = watch("recipient");

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!selectedToken || !amountValue || !address) {
      if (!amountValue) {
        dispatch({ type: "transferForm/setGasError", payload: false });
        dispatch({ type: "transferForm/setIsEstimating", payload: false });
      }
      return;
    }

    debounceRef.current = setTimeout(() => {
      getRequiredGasAmount(
        selectedToken,
        parseUnits(amountValue, selectedToken.decimals),
        (recipientValue as `0x${string}`) || address
      );
    }, TIMING_CONSTANTS.GAS_ESTIMATION_DEBOUNCE);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [
    amountValue,
    selectedToken,
    address,
    recipientValue,
    getRequiredGasAmount,
    dispatch,
  ]);

  useEffect(() => {
    if (txFlow.phase === "confirmed") {
      const timer = setTimeout(() => {
        dispatch(resetTransaction(undefined));
      }, TIMING_CONSTANTS.AUTO_HIDE_SUCCESS);

      return () => clearTimeout(timer);
    }
  }, [txFlow.phase, dispatch]);

  useEffect(() => {
    if (refetchTrigger > 0) {
      refetchBalance();
    }
  }, [refetchTrigger, refetchBalance]);

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

        reset({
          amount: "",
          recipient: "",
          tokenAddress: selectedToken!.token_address,
        });

        dispatch(resetForm());

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

  const handleTransactionEstimate = useCallback(
    async (hash: `0x${string}`) => {
      if (gasMetrics && chainId) {
        const estimate = await estimateTransaction(
          hash,
          gasMetrics,
          chainId as CHAIN_ID
        );
        if (estimate) {
          dispatch(updateEstimate(estimate));
        }
      }
    },
    [gasMetrics, chainId, estimateTransaction, dispatch]
  );

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

  const onSubmit = useCallback(
    async (data: TransferFormValues) => {
      if (!selectedToken) {
        syncedToast.error("No token selected");
        return;
      }

      dispatch(startSigning(undefined));

      let initiatingToastId: string | undefined;

      try {
        const amountInWei = parseUnits(data.amount, selectedToken.decimals);
        let hash: `0x${string}`;

        if (selectedToken.native_token) {
          initiatingToastId = syncedToast.loading("Initiating Native Token transfer...");
          hash = await sendTransaction(config, {
            to: data.recipient as `0x${string}`,
            value: amountInWei,
          });
        } else {
          initiatingToastId = syncedToast.loading("Initiating ERC20 Token transfer...");
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
