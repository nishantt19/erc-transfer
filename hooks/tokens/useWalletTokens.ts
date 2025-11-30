import { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CHAIN_CONFIG, TIMING_CONSTANTS } from "@/constants";
import { type Token, type API_RESPONSE } from "@/types";

const fetchWalletTokens = async (
  address: string,
  chain: string
): Promise<API_RESPONSE> => {
  const res = await axios.get<API_RESPONSE>("/api/tokens", {
    params: { address, chain },
  });
  return res.data;
};

export const useWalletTokens = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const chain = CHAIN_CONFIG[chainId]?.MORALIS_ID;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["walletTokens", address, chain],
    queryFn: () => fetchWalletTokens(address!, chain!),
    enabled: !!address && !!chain && isConnected,
    staleTime: TIMING_CONSTANTS.TOKEN_STALE_TIME,
  });

  const tokens = useMemo(() => data?.result || [], [data?.result]);

  const nativeToken: Token | null = useMemo(
    () => tokens.find((token: Token) => token.native_token) || null,
    [tokens]
  );

  return {
    tokens,
    nativeToken,
    isLoading,
    isConnected,
    refetch,
  };
};
