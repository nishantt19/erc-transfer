import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useMemo } from "react";
import axios from "axios";
import type { InfuraGasResponse } from "@/types";

const REFETCH_INTERVAL = 12000;

const fetchGasMetrics = async (
  chainId: number
): Promise<InfuraGasResponse> => {
  const res = await axios.get<InfuraGasResponse>("/api/gas", {
    params: { chainId },
  });
  return res.data;
};

export const useGasMetrics = () => {
  const { chainId } = useAccount();

  const queryFn = useMemo(
    () => async () => {
      if (!chainId) throw new Error("No chain ID available");
      return fetchGasMetrics(chainId);
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
