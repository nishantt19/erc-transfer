import { useMemo } from "react";
import { useTransaction } from "wagmi";

import type { CHAIN_ID, TransactionStatusType } from "@/types";
import { TIMING_CONSTANTS } from "@/constants";

interface UseTransactionStatusProps {
  hash: `0x${string}` | null;
  chainId: CHAIN_ID | undefined;
}

export const useTransactionStatus = ({
  hash,
  chainId,
}: UseTransactionStatusProps) => {
  const { data } = useTransaction({
    hash: hash ?? undefined,
    chainId,
    query: {
      enabled: !!hash && !!chainId,
      refetchInterval: TIMING_CONSTANTS.TRANSACTION_POLL_INTERVAL,
      notifyOnChangeProps: ["data"],
    },
  });

  const status = useMemo<TransactionStatusType>(() => {
    if (!hash) return "idle";
    if (!data) return "pending";
    return data.blockNumber !== null ? "included" : "pending";
  }, [hash, data]);

  const blockNumber = useMemo(() => data?.blockNumber ?? undefined, [data]);

  return { status, blockNumber };
};
