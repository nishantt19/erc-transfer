"use client";
import { useCallback, useRef, useMemo, useEffect } from "react";
import { useAccount, useWatchBlocks, useTransaction } from "wagmi";
import type { Block } from "viem";

interface UseTransactionReplacementProps {
  txHash: `0x${string}` | null;
  chainId?: number;
  enabled?: boolean;
  onHashChange?: (newHash: `0x${string}`, oldHash: `0x${string}`) => void;
  onComplete?: (finalHash: `0x${string}`) => void;
}

/**
 * useTransactionReplacement
 * -------------------------
 * Watches for transaction replacements (speed-up/cancel) and completion.
 * Uses useWatchBlocks with fast polling to detect mined blocks.
 *
 * Features:
 * - Fast replacement detection via block monitoring (1s polling)
 * - Detects replacement transactions (same nonce, different hash)
 * - Detects when the final transaction is mined
 * - Notifies parent via callbacks
 * - Minimal re-renders using refs
 */
export const useTransactionReplacement = ({
  txHash,
  chainId,
  enabled = true,
  onHashChange,
  onComplete,
}: UseTransactionReplacementProps) => {
  const { address } = useAccount();

  const nonceRef = useRef<number | null>(null);
  const currentHashRef = useRef<`0x${string}` | null>(txHash);
  const wasReplacedRef = useRef(false);
  const isCompleteRef = useRef(false);
  const initialHashRef = useRef(txHash);

  // Get transaction details to extract nonce
  const { data: txData } = useTransaction({
    hash: txHash ?? undefined,
    chainId,
    query: {
      enabled: !!txHash && enabled,
      staleTime: Infinity,
    },
  });

  // Store nonce from transaction data
  useEffect(() => {
    if (txData?.nonce !== undefined && nonceRef.current === null) {
      nonceRef.current = txData.nonce;
    }
  }, [txData]);

  // Reset refs when txHash changes (new transaction)
  useEffect(() => {
    if (txHash !== initialHashRef.current) {
      initialHashRef.current = txHash;
      currentHashRef.current = txHash;
      nonceRef.current = null;
      wasReplacedRef.current = false;
      isCompleteRef.current = false;
    }
  }, [txHash]);

  // Block watcher callback for detection and completion
  const handleBlock = useCallback(
    (block: Block) => {
      if (
        !enabled ||
        !address ||
        !currentHashRef.current ||
        isCompleteRef.current ||
        nonceRef.current === null
      )
        return;

      // Check all transactions in the block
      for (const tx of block.transactions) {
        if (typeof tx === "string") continue;

        // Check if this transaction is from the same address with the same nonce
        if (
          tx.from?.toLowerCase() === address.toLowerCase() &&
          tx.nonce === nonceRef.current
        ) {
          // Check if this is a replacement (different hash, same nonce)
          if (tx.hash !== currentHashRef.current) {
            const oldHash = currentHashRef.current;
            currentHashRef.current = tx.hash;
            wasReplacedRef.current = true;
            isCompleteRef.current = true;
            onHashChange?.(tx.hash, oldHash);
            onComplete?.(tx.hash);
            return;
          }

          // This is our current transaction being mined
          if (tx.hash === currentHashRef.current) {
            isCompleteRef.current = true;
            onComplete?.(currentHashRef.current);
            return;
          }
        }
      }
    },
    [enabled, address, onHashChange, onComplete]
  );

  // Watch blocks with fast polling (1 second)
  useWatchBlocks({
    enabled: enabled && !!txHash && nonceRef.current !== null,
    includeTransactions: true,
    onBlock: handleBlock,
    pollingInterval: 1000, // Poll every 1 second for faster detection
  });

  // Return memoized values to prevent unnecessary re-renders
  return useMemo(
    () => ({
      currentHash: currentHashRef.current,
      wasReplaced: wasReplacedRef.current,
      isComplete: isCompleteRef.current,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txHash]
  );
};
