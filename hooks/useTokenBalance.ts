import { useMemo, useCallback } from "react";
import { formatUnits, erc20Abi } from "viem";
import { useAccount, useReadContract, useBalance } from "wagmi";
import { type Token } from "@/types";
import { formatBalance, calculateUsdValue } from "@/utils/utils";

export const useTokenBalance = (token: Token | null, amount?: string) => {
  const { address } = useAccount();

  const { data: nativeBalanceData, refetch: refetchNativeBalance } = useBalance(
    {
      address: address,
      query: {
        enabled: !!token?.native_token && !!address,
      },
    }
  );

  const { data: erc20BalanceData, refetch: refetchERC20Balance } =
    useReadContract({
      address: token?.token_address as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
      query: {
        enabled: !!token && !token.native_token && !!address,
      },
    });

  const balanceInWei = useMemo(() => {
    if (!token) return "0";
    if (token.native_token) return nativeBalanceData?.value.toString() ?? "0";
    return erc20BalanceData?.toString() ?? "0";
  }, [token, nativeBalanceData, erc20BalanceData]);

  const balance = useMemo(
    () => (token ? formatUnits(BigInt(balanceInWei), token.decimals) : "0"),
    [token, balanceInWei]
  );

  const formattedBalance = useMemo(
    () => (token ? parseFloat(formatBalance(balanceInWei, token.decimals)) : 0),
    [token, balanceInWei]
  );

  const usdValue = useMemo(
    () => (token && amount ? calculateUsdValue(amount, token) : "0.00"),
    [token, amount]
  );

  const isInsufficientBalance = useMemo(() => {
    if (!amount || !token) return false;
    return parseFloat(amount) > parseFloat(balance);
  }, [amount, balance, token]);

  const refetchBalance = useCallback(async () => {
    if (!token) return;
    if (token.native_token) {
      await refetchNativeBalance();
    } else {
      await refetchERC20Balance();
    }
  }, [token, refetchNativeBalance, refetchERC20Balance]);

  return {
    balance,
    balanceInWei,
    formattedBalance,
    usdValue,
    isInsufficientBalance,
    refetchBalance,
  };
};
