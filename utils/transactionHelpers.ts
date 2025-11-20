import { getTransaction } from "@wagmi/core";
import { config } from "@/config/wagmi";
import { CHAIN_ID } from "@/types";

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

type WagmiTransaction = Awaited<ReturnType<typeof getTransaction>>;

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
      if (retries >= maxRetries) {
        console.error("Transaction not found after retries:", error);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }

  return null;
};
