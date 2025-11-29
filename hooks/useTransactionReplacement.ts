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

  const nonceRef = useRef<number | null>(null);
  const currentHashRef = useRef<`0x${string}` | null>(txHash);
  const wasReplacedRef = useRef(false);
  const isCompleteRef = useRef(false);
  const initialHashRef = useRef(txHash);

  const { data: txData } = useTransaction({
    hash: txHash ?? undefined,
    chainId,
    query: {
      enabled: !!txHash && enabled,
      staleTime: Infinity,
    },
  });

  useEffect(() => {
    if (txData?.nonce !== undefined && nonceRef.current === null) {
      nonceRef.current = txData.nonce;
    }
  }, [txData]);

  useEffect(() => {
    if (txHash !== initialHashRef.current) {
      initialHashRef.current = txHash;
      currentHashRef.current = txHash;
      nonceRef.current = null;
      wasReplacedRef.current = false;
      isCompleteRef.current = false;
    }
  }, [txHash]);

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

        if (
          tx.from?.toLowerCase() === address.toLowerCase() &&
          tx.nonce === nonceRef.current
        ) {
          if (tx.hash !== currentHashRef.current) {
            const oldHash = currentHashRef.current;
            currentHashRef.current = tx.hash;
            wasReplacedRef.current = true;
            isCompleteRef.current = true;
            onHashChange?.(tx.hash, oldHash);
            return;
          }

          if (tx.hash === currentHashRef.current) {
            isCompleteRef.current = true;
            return;
          }
        }
      }
    },
    [enabled, address, onHashChange]
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txHash]
  );
};
