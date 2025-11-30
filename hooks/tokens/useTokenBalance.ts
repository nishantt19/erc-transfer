import { useCallback } from "react";
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

  const balanceInWei = !token
    ? "0"
    : token.native_token
    ? nativeBalanceData?.value.toString() ?? "0"
    : erc20BalanceData?.toString() ?? "0";

  const balance = token ? formatUnits(BigInt(balanceInWei), token.decimals) : "0";

  const formattedBalance = token
    ? parseFloat(formatBalance(balanceInWei, token.decimals))
    : 0;

  const usdValue =
    token && amount ? calculateUsdValue(amount, token) : "0.00";

  const isInsufficientBalance =
    !amount || !token ? false : parseFloat(amount) > parseFloat(balance);

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
