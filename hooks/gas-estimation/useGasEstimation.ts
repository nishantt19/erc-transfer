import { useMemo, useRef, useCallback, useEffect } from "react";
import { erc20Abi, parseUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { estimateGas, getPublicClient } from "@wagmi/core";

import type { CHAIN_ID, Token, InfuraGasResponse } from "@/types";
import { calculateRequiredGasAmount } from "@/utils/utils";
import { BIGINT_ZERO, GAS_CONSTANTS } from "@/constants";
import { config } from "@/config/wagmi";
import { useAppDispatch } from "@/store/hooks";
import { setGasError, setIsEstimating } from "@/store/slices/transferFormSlice";

export const useGasEstimation = (gasMetrics?: InfuraGasResponse) => {
  const { address, chainId, isConnected } = useAccount();
  const dispatch = useAppDispatch();
  const { data: balance } = useBalance({
    address,
    chainId: chainId as CHAIN_ID,
  });

  const client = useMemo(
    () => getPublicClient(config, { chainId: chainId as CHAIN_ID }),
    [chainId]
  );

  // Prevent re-estimating gas for amounts that already failed due to insufficient balance
  const lastFailedAmountRef = useRef<bigint | null>(null);

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      dispatch(setGasError(false));
      dispatch(setIsEstimating(false));
      lastFailedAmountRef.current = null;
    }
  }, [isConnected, dispatch]);

  // Reset state when switching chains
  useEffect(() => {
    dispatch(setGasError(false));
    dispatch(setIsEstimating(false));
    lastFailedAmountRef.current = null;
  }, [chainId, dispatch]);

  const getRequiredGasAmount = useCallback(
    async (
      token: Token,
      amountWei: bigint,
      to: `0x${string}`
    ): Promise<bigint> => {
      // Ignore zero/invalid inputs
      if (!address || !amountWei || Number(amountWei) === 0) {
        dispatch(setGasError(false));
        lastFailedAmountRef.current = null;
        return BIGINT_ZERO;
      }

      // Skip estimation if amount >= last failed amount to avoid repeated failures
      if (
        lastFailedAmountRef.current !== null &&
        amountWei >= lastFailedAmountRef.current
      ) {
        dispatch(setGasError(true));
        return parseUnits(
          GAS_CONSTANTS.FALLBACK_RESERVE_NATIVE_TOKEN,
          GAS_CONSTANTS.NATIVE_TOKEN_DECIMALS
        );
      }

      // If new amount is smaller than previous failed amount, allow re-estimate
      if (
        lastFailedAmountRef.current !== null &&
        amountWei < lastFailedAmountRef.current
      ) {
        lastFailedAmountRef.current = null;
      }

      dispatch(setIsEstimating(true));
      dispatch(setGasError(false));

      try {
        let gasPrice: bigint;
        if (gasMetrics?.medium?.suggestedMaxFeePerGas) {
          gasPrice = parseUnits(gasMetrics.medium.suggestedMaxFeePerGas, 9);
        } else {
          const { getGasPrice: fetchGasPrice } = await import("@wagmi/core");
          gasPrice = await fetchGasPrice(config, {
            chainId: chainId as CHAIN_ID,
          });
        }
        let gasEstimate: bigint;

        // Native token transfer gas estimation
        if (token.native_token) {
          try {
            gasEstimate = await estimateGas(config, {
              chainId: chainId as CHAIN_ID,
              account: address,
              to,
              value: amountWei,
            });
          } catch (error) {
            console.error("Error estimating gas for native token", error);
            gasEstimate = GAS_CONSTANTS.STANDARD_TRANSFER_GAS;
          }
        } else {
          // ERC-20 transfer gas estimation
          try {
            gasEstimate = await client.estimateContractGas({
              account: address,
              address: token.token_address,
              abi: erc20Abi,
              functionName: "transfer",
              args: [to, amountWei],
            });
          } catch (error) {
            console.error("Error estimating gas for erc20", error);
            gasEstimate = GAS_CONSTANTS.ERC20_TRANSFER_GAS;
          }
        }

        const requiredGas = calculateRequiredGasAmount(gasEstimate, gasPrice);
        const nativeTokenBalance = balance?.value ?? BIGINT_ZERO;

        // Native tokens require (balance - amount) >= requiredGas
        let hasGasError = false;
        if (token.native_token) {
          hasGasError = nativeTokenBalance - amountWei < requiredGas;
        } else {
          hasGasError = nativeTokenBalance < requiredGas;
        }

        dispatch(setGasError(hasGasError));

        // Cache failed amount to avoid repeated failing estimations
        lastFailedAmountRef.current = hasGasError ? amountWei : null;

        return requiredGas;
      } catch (error) {
        console.error("Unexpected error estimating gas", error);
        dispatch(setGasError(true));
        lastFailedAmountRef.current = amountWei;

        // Provide a fallback estimate when failing entirely
        return parseUnits(
          GAS_CONSTANTS.FALLBACK_RESERVE_NATIVE_TOKEN,
          GAS_CONSTANTS.NATIVE_TOKEN_DECIMALS
        );
      } finally {
        dispatch(setIsEstimating(false));
      }
    },
    [address, chainId, client, balance?.value, dispatch, gasMetrics]
  );

  return {
    getRequiredGasAmount,
  };
};
