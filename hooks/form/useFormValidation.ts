import { useEffect } from "react";
import { useAccount } from "wagmi";

import { useAppDispatch } from "@/store/hooks";
import { validateAndClearIfNeeded } from "@/store/slices/transferFormSlice";
import { validateTransactionAndClearIfNeeded } from "@/store/slices/transactionSlice";
import { updateWalletContext, getPersistedWalletContext } from "@/store";

/**
 * Validates and clears stale form/transaction data when wallet context changes
 * Prevents showing data from previous wallet/chain when user switches
 */
export const useFormValidation = () => {
  const { isConnected, chainId, address } = useAccount();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isConnected || !address || !chainId) return;

    // Get the last known wallet context from localStorage
    const persistedContext = getPersistedWalletContext();
    const validationPayload = {
      address: address.toLowerCase(),
      chainId,
      persistedContext,
    };

    // Clear form and transaction state if wallet/chain changed
    dispatch(validateAndClearIfNeeded(validationPayload));
    dispatch(validateTransactionAndClearIfNeeded(validationPayload));

    // Update current context for next validation
    updateWalletContext(address.toLowerCase(), chainId);
  }, [isConnected, address, chainId, dispatch]);
};
