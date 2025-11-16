import { useMemo } from "react";
import { formatUnits } from "viem";
import { type Token } from "@/types";
import { formatBalance, calculateUsdValue } from "@/utils/utils";

export const useTokenBalance = (token: Token | null, amount?: string) => {
  const balance = useMemo(
    () => (token ? formatUnits(BigInt(token.balance), token.decimals) : "0"),
    [token]
  );

  const formattedBalance = useMemo(
    () =>
      token ? parseFloat(formatBalance(token.balance, token.decimals)) : 0,
    [token]
  );

  const usdValue = useMemo(
    () => (token && amount ? calculateUsdValue(amount, token) : "0.00"),
    [token, amount]
  );

  const isInsufficientBalance = useMemo(() => {
    if (!amount || !token) return false;
    const currentAmount = parseFloat(amount);
    const tokenBalance = parseFloat(balance);
    return currentAmount > tokenBalance;
  }, [amount, balance, token]);

  return {
    balance,
    formattedBalance,
    usdValue,
    isInsufficientBalance,
  };
};
