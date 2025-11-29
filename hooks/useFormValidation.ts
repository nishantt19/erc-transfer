import { useEffect } from "react";
import { useAccount } from "wagmi";

import { useAppDispatch } from "@/store/hooks";
import { validateAndClearIfNeeded } from "@/store/slices/transferFormSlice";
import { validateTransactionAndClearIfNeeded } from "@/store/slices/transactionSlice";
import { updateWalletContext, getPersistedWalletContext } from "@/store";

export const useFormValidation = () => {
  const { isConnected, chainId, address } = useAccount();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isConnected || !address || !chainId) return;

    const persistedContext = getPersistedWalletContext();
    const validationPayload = {
      address: address.toLowerCase(),
      chainId,
      persistedContext,
    };

    dispatch(validateAndClearIfNeeded(validationPayload));
    dispatch(validateTransactionAndClearIfNeeded(validationPayload));
    updateWalletContext(address.toLowerCase(), chainId);
  }, [isConnected, address, chainId, dispatch]);
};
