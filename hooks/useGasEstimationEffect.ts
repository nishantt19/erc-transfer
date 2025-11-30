import { useEffect, useRef, useCallback } from "react";
import { parseUnits } from "viem";
import { useAppDispatch } from "@/store/hooks";
import type { Token } from "@/types";
import { TIMING_CONSTANTS } from "@/constants";

interface UseGasEstimationEffectProps {
  selectedToken: Token | null;
  amountValue: string;
  recipientValue: string;
  address: `0x${string}` | undefined;
  getRequiredGasAmount: (
    token: Token,
    amountWei: bigint,
    to: `0x${string}`
  ) => Promise<bigint>;
}

export const useGasEstimationEffect = ({
  selectedToken,
  amountValue,
  recipientValue,
  address,
  getRequiredGasAmount,
}: UseGasEstimationEffectProps) => {
  const dispatch = useAppDispatch();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleGasEstimation = useCallback(() => {
    if (!selectedToken || !amountValue || !address) {
      if (!amountValue) {
        dispatch({ type: "transferForm/setGasError", payload: false });
        dispatch({ type: "transferForm/setIsEstimating", payload: false });
      }
      return;
    }

    getRequiredGasAmount(
      selectedToken,
      parseUnits(amountValue, selectedToken.decimals),
      (recipientValue as `0x${string}`) || address
    );
  }, [
    selectedToken,
    amountValue,
    address,
    recipientValue,
    getRequiredGasAmount,
    dispatch,
  ]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!selectedToken || !amountValue || !address) {
      if (!amountValue) {
        dispatch({ type: "transferForm/setGasError", payload: false });
        dispatch({ type: "transferForm/setIsEstimating", payload: false });
      }
      return;
    }

    debounceRef.current = setTimeout(() => {
      handleGasEstimation();
    }, TIMING_CONSTANTS.GAS_ESTIMATION_DEBOUNCE);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [handleGasEstimation, amountValue, selectedToken, address, dispatch]);

  return { handleGasEstimation };
};
