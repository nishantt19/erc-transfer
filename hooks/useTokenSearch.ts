import { useState, useEffect, useMemo } from "react";
import { useAccount, useReadContracts, useChainId } from "wagmi";
import { type Address, isAddress, erc20Abi } from "viem";
import { useQuery } from "@tanstack/react-query";
import { type Token } from "@/types";
import { formatBalance, isTestnetChain } from "@/utils/utils";
import { CHAIN_CONFIG } from "@/utils/constants";

type TokenSearchResult = {
  token: Token | null;
  isLoading: boolean;
  isError: boolean;
  isManualSearch: boolean;
};

const DEBOUNCE_DELAY = 500;

export const useTokenSearch = (
  searchAddress: string,
  existingTokens: Token[] = []
): TokenSearchResult => {
  const { address: walletAddress } = useAccount();
  const chainId = useChainId();
  const [isManualSearch, setIsManualSearch] = useState(false);
  const [debouncedAddress, setDebouncedAddress] = useState("");

  const isTestnet = isTestnetChain(chainId);
  const chain = useMemo(() => CHAIN_CONFIG[chainId].MORALIS_ID, [chainId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAddress(searchAddress);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchAddress]);

  const validAddress = useMemo(() => {
    if (!debouncedAddress || !isAddress(debouncedAddress)) return null;
    return debouncedAddress as Address;
  }, [debouncedAddress]);

  const existingToken = useMemo(() => {
    if (!validAddress || !existingTokens.length) return null;
    return (
      existingTokens.find(
        (t) => t.token_address.toLowerCase() === validAddress.toLowerCase()
      ) || null
    );
  }, [validAddress, existingTokens]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsManualSearch(!!validAddress && !existingToken);
  }, [validAddress, existingToken]);

  const {
    data: apiData,
    isLoading: isApiLoading,
    isError: isApiError,
  } = useQuery<Token>({
    queryKey: ["tokenSearch", validAddress, chain],
    queryFn: async () => {
      const response = await fetch(
        `/api/token-search?tokenAddress=${validAddress}&chain=${chain}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch token metadata");
      }

      return response.json();
    },
    enabled: !!validAddress && !!chain && !existingToken && !isTestnet,
    retry: false,
    staleTime: 60000,
  });

  const { data: contractData, isLoading: isContractLoading } = useReadContracts(
    {
      contracts: validAddress
        ? [
            {
              address: validAddress,
              abi: erc20Abi,
              functionName: "name",
            },
            {
              address: validAddress,
              abi: erc20Abi,
              functionName: "symbol",
            },
            {
              address: validAddress,
              abi: erc20Abi,
              functionName: "decimals",
            },
            {
              address: validAddress,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: walletAddress ? [walletAddress] : undefined,
            },
          ]
        : undefined,
      query: {
        enabled: !!validAddress && !!walletAddress && !existingToken,
      },
    }
  );

  const token = useMemo((): Token | null => {
    if (existingToken) return existingToken;

    if (!validAddress) return null;

    if (!isTestnet && apiData && contractData) {
      const [, , , balanceResult] = contractData;

      if (balanceResult.status === "failure") {
        return null;
      }

      const balanceRaw = balanceResult.result;

      const balance = formatBalance(balanceRaw, apiData.decimals, 6);

      return {
        token_address: validAddress,
        name: apiData.name,
        symbol: apiData.symbol,
        logo: apiData.logo,
        decimals: apiData.decimals,
        balance,
        usd_price: apiData.usd_price,
        native_token: false,
      };
    }

    if (isTestnet && contractData) {
      const [nameResult, symbolResult, decimalsResult, balanceResult] =
        contractData;

      if (
        nameResult.status === "failure" ||
        symbolResult.status === "failure" ||
        decimalsResult.status === "failure" ||
        balanceResult.status === "failure"
      ) {
        return null;
      }

      const name = nameResult.result as string;
      const symbol = symbolResult.result as string;
      const decimals = decimalsResult.result as number;
      const balanceRaw = balanceResult.result as bigint;

      const balance = formatBalance(balanceRaw, decimals, 6);

      return {
        token_address: validAddress,
        name,
        symbol,
        logo: null,
        decimals,
        balance,
        usd_price: "0",
        native_token: false,
      };
    }

    return null;
  }, [validAddress, existingToken, apiData, contractData, isTestnet]);

  const isLoading = useMemo(() => {
    if (!validAddress || existingToken) return false;

    if (!isTestnet) {
      return isApiLoading || isContractLoading;
    }

    return isContractLoading;
  }, [validAddress, existingToken, isTestnet, isApiLoading, isContractLoading]);

  const isError = useMemo(() => {
    if (!validAddress || existingToken) return false;

    if (!isTestnet) {
      return isApiError || (!isLoading && !token && !!validAddress);
    }

    return !isLoading && !token && !!validAddress;
  }, [validAddress, existingToken, isTestnet, isApiError, isLoading, token]);

  return {
    token,
    isLoading,
    isError,
    isManualSearch,
  };
};
