import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useMemo } from "react";
import axios from "axios";
import type { InfuraGasResponse } from "@/types";

const REFETCH_INTERVAL = 12000;

export const useGasMetrics = () => {
  const { chainId } = useAccount();

  const queryFn = useMemo(
    () => async () => {
      if (!chainId) throw new Error("No chain ID available");

      const response = await axios.get<InfuraGasResponse>(
        `https://gas.api.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}/networks/${chainId}/suggestedGasFees`
      );
      return response.data;
    },
    [chainId]
  );

  const {
    data: gasMetrics,
    isLoading,
    error,
  } = useQuery<InfuraGasResponse>({
    queryKey: ["gasMetrics", chainId],
    queryFn,
    enabled: !!chainId,
    staleTime: REFETCH_INTERVAL,
    refetchInterval: REFETCH_INTERVAL,
  });

  return {
    gasMetrics,
    isLoading,
    error,
  };
};
