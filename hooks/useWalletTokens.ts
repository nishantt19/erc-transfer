import { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CHAIN_CONFIG } from "@/utils/constants";
import { type Token } from "@/types";

const fetchWalletTokens = async (address: string, chain: string) => {
  const res = await axios.get("/api/tokens", {
    params: { address, chain },
  });
  return res.data;
};

export const useWalletTokens = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const chain = useMemo(() => CHAIN_CONFIG[chainId].MORALIS_ID, [chainId]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["walletTokens", address, chain],
    queryFn: () => fetchWalletTokens(address!, chain!),
    enabled: !!address && !!chain && isConnected,
    refetchOnWindowFocus: true,
    staleTime: 60000,
  });

  const tokens = useMemo(() => data?.result || [], [data?.result]);

  const nativeToken: Token = useMemo(
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
