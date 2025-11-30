"use client";
import { useCallback, useRef, useMemo, useEffect } from "react";
import { useAccount, useWatchBlocks, useTransaction } from "wagmi";
import type { Block } from "viem";

interface UseTransactionReplacementProps {
  txHash: `0x${string}` | null;
  chainId?: number;
  enabled?: boolean;
  onHashChange?: (newHash: `0x${string}`, oldHash: `0x${string}`) => void;
}

export const useTransactionReplacement = ({
  txHash,
  chainId,
  enabled = true,
  onHashChange,
}: UseTransactionReplacementProps) => {
  const { address } = useAccount();

  // Track nonce and current hash to detect replacements
  const nonceRef = useRef<number | null>(null);
  const currentHashRef = useRef<`0x${string}` | null>(txHash);
  const wasReplacedRef = useRef(false);
  const isCompleteRef = useRef(false);
  const initialHashRef = useRef(txHash);

  // Fetch initial transaction to get nonce
  const { data: txData } = useTransaction({
    hash: txHash ?? undefined,
    chainId,
    query: {
      enabled: !!txHash && enabled,
      staleTime: Infinity, // Never refetch
    },
  });

  // Store nonce on first load
  useEffect(() => {
    if (txData?.nonce !== undefined && nonceRef.current === null) {
      nonceRef.current = txData.nonce;
    }
  }, [txData]);

  // Reset tracking when a new txHash is provided
  useEffect(() => {
    if (txHash !== initialHashRef.current) {
      initialHashRef.current = txHash;
      currentHashRef.current = txHash;
      nonceRef.current = null;
      wasReplacedRef.current = false;
      isCompleteRef.current = false;
    }
  }, [txHash]);

  // Detect speedup/cancel transactions by matching nonce
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

      for (const tx of block.transactions) {
        if (typeof tx === "string") continue;

        // Replacement tx = same sender + same nonce
        if (
          tx.from?.toLowerCase() === address.toLowerCase() &&
          tx.nonce === nonceRef.current
        ) {
          // New hash indicates speedup/cancel replacement
          if (tx.hash !== currentHashRef.current) {
            const oldHash = currentHashRef.current;
            currentHashRef.current = tx.hash;
            wasReplacedRef.current = true;
            isCompleteRef.current = true;
            onHashChange?.(tx.hash, oldHash);
            return;
          }

          // If matching hash appears again, original tx was included
          if (tx.hash === currentHashRef.current) {
            isCompleteRef.current = true;
            return;
          }
        }
      }
    },
    [enabled, address, onHashChange]
  );

  // Watch new blocks to detect replacements only when nonce is known
  useWatchBlocks({
    enabled: enabled && !!txHash && nonceRef.current !== null,
    includeTransactions: true,
    onBlock: handleBlock,
    pollingInterval: 1000,
  });

  return useMemo(
    () => ({
      currentHash: currentHashRef.current,
      wasReplaced: wasReplacedRef.current,
      isComplete: isCompleteRef.current,
    }),
    // Only re-memoize when txHash changes - refs are intentionally excluded
    // as they're updated in effects and we want their current values on access
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txHash]
  );
};
