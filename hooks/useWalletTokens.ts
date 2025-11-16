import { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { MORALIS_CHAIN_MAP } from "@/utils/constants";
import { type Token } from "@/types";

async function fetchWalletTokens(address: string, chain: string) {
  const res = await axios.get("/api/tokens", {
    params: { address, chain },
  });
  return res.data;
}

export const useWalletTokens = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const chain = useMemo(() => MORALIS_CHAIN_MAP[chainId], [chainId]);

  const { data, isLoading } = useQuery({
    queryKey: ["walletTokens", address, chain],
    queryFn: () => fetchWalletTokens(address!, chain!),
    enabled: !!address && !!chain && isConnected,
  });

  const nativeToken: Token = useMemo(() => {
    return data?.result?.find((token: Token) => token.native_token) || null;
  }, [data]);

  return {
    tokens: data?.result || [],
    nativeToken,
    isLoading,
    isConnected,
  };
};
