import { getTransaction } from "@wagmi/core";
import { config } from "@/config/wagmi";
import { CHAIN_ID } from "@/types";

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

type WagmiTransaction = Awaited<ReturnType<typeof getTransaction>>;

// Retry fetching transaction to handle propagation delays across RPC nodes
export const fetchTransactionWithRetry = async (
  hash: `0x${string}`,
  chainId: CHAIN_ID,
  maxRetries: number = MAX_RETRIES
): Promise<WagmiTransaction | null> => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const tx = await getTransaction(config, { hash, chainId });

      if (tx) {
        return tx as WagmiTransaction;
      }
    } catch (error) {
      retries++;
      // Stop retrying when max attempts are reached
      if (retries >= maxRetries) {
        console.error("Transaction not found after retries:", error);
        return null;
      }
      // Small delay before another attempt
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }

  return null;
};
