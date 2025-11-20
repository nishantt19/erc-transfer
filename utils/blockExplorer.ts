import type { CHAIN_ID } from "@/types";

const BLOCK_EXPLORERS: Record<CHAIN_ID, string> = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
  100: "https://gnosisscan.io",
  8453: "https://basescan.org",
  84532: "https://sepolia.basescan.org",
};

export const getBlockExplorerUrl = (chainId: CHAIN_ID): string =>
  BLOCK_EXPLORERS[chainId];

export const getTransactionUrl = (
  chainId: CHAIN_ID,
  txHash: `0x${string}`
): string => `${getBlockExplorerUrl(chainId)}/tx/${txHash}`;
