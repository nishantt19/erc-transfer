import { useState, useEffect, useMemo } from "react";
import { useAccount, useReadContracts, useChainId } from "wagmi";
import { type Address, isAddress, erc20Abi } from "viem";
import { useQuery } from "@tanstack/react-query";
import { type Token } from "@/types";
import { formatBalance, isTestnetChain } from "@/utils/utils";
import { CHAIN_CONFIG } from "@/constants";

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

  // Debounce user input to avoid unnecessary RPC/API calls
  const [debouncedAddress, setDebouncedAddress] = useState("");

  const isTestnet = isTestnetChain(chainId);

  const chain = CHAIN_CONFIG[chainId]?.MORALIS_ID;

  useEffect(() => {
    const trimmed = searchAddress.trim();

    const timer = setTimeout(
      () => {
        setDebouncedAddress(trimmed);
      },
      trimmed ? DEBOUNCE_DELAY : 0
    );

    return () => clearTimeout(timer);
  }, [searchAddress]);

  // Validate only when debounced to reduce overhead
  const validAddress: Address | null =
    debouncedAddress && isAddress(debouncedAddress)
      ? (debouncedAddress as Address)
      : null;

  // If token already exists in local list, skip external fetches
  const existingToken = useMemo(() => {
    if (!validAddress || !existingTokens.length) return null;
    return (
      existingTokens.find(
        (t) => t.token_address.toLowerCase() === validAddress.toLowerCase()
      ) || null
    );
  }, [validAddress, existingTokens]);

  // Indicates whether user provided a valid address that's not in existing tokens
  const isManualSearch = !!validAddress && !existingToken;

  // Mainnet: fetch metadata from API first
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

  const contractConfig = validAddress
    ? { address: validAddress, abi: erc20Abi }
    : null;

  // Testnet/fallback: fetch all metadata from contract; Mainnet: only fetch balance
  const { data: contractData, isLoading: isContractLoading } = useReadContracts(
    {
      contracts: contractConfig
        ? isTestnet || isApiError
          ? [
              { ...contractConfig, functionName: "name" },
              { ...contractConfig, functionName: "symbol" },
              { ...contractConfig, functionName: "decimals" },
              {
                ...contractConfig,
                functionName: "balanceOf",
                args: walletAddress ? [walletAddress] : undefined,
              },
            ]
          : [
              {
                ...contractConfig,
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

  // Consolidate token data from API and/or contract reads
  const token = useMemo((): Token | null => {
    if (existingToken) return existingToken;

    if (!validAddress) return null;

    // Mainnet + API success: combine API metadata with balance
    if (!isTestnet && apiData && contractData) {
      const balanceResult = contractData[0];

      if (!balanceResult || balanceResult.status === "failure") {
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

    // Testnet or API failure: use contract data entirely
    if (
      (isTestnet || isApiError) &&
      contractData &&
      contractData.length === 4
    ) {
      const [nameResult, symbolResult, decimalsResult, balanceResult] =
        contractData;

      if (
        !nameResult ||
        !symbolResult ||
        !decimalsResult ||
        !balanceResult ||
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
  }, [
    validAddress,
    existingToken,
    apiData,
    contractData,
    isTestnet,
    isApiError,
  ]);

  // Determine loading and error states
  const isLoading =
    !!validAddress &&
    !existingToken &&
    (!isTestnet ? isApiLoading || isContractLoading : isContractLoading);

  const isError =
    !!validAddress &&
    !existingToken &&
    !isLoading &&
    (isTestnet ? !token : isApiError || !token);

  return {
    token,
    isLoading,
    isError,
    isManualSearch,
  };
};
