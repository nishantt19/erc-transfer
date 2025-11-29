import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import axios from "axios";
import type { InfuraGasResponse } from "@/types";
import { TIMING_CONSTANTS } from "@/constants";

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

  const {
    data: gasMetrics,
    isLoading,
    error,
  } = useQuery<InfuraGasResponse>({
    queryKey: ["gasMetrics", chainId],
    queryFn: async () => {
      if (!chainId) throw new Error("No chain ID available");
      return fetchGasMetrics(chainId);
    },
    enabled: !!chainId,
    staleTime: TIMING_CONSTANTS.GAS_REFETCH_INTERVAL,
    refetchInterval: TIMING_CONSTANTS.GAS_REFETCH_INTERVAL,
  });

  return {
    gasMetrics,
    isLoading,
    error,
  };
};
