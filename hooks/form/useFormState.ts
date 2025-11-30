import { useEffect, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTokenAndResetAmount } from "@/store/slices/transferFormSlice";
import {
  type TransferFormValues,
  transferSchema,
} from "@/schema/transferSchema";
import { type Token } from "@/types";

interface UseFormStateProps {
  initialToken?: Token | null;
}

export const useFormState = ({
  initialToken = null,
}: UseFormStateProps = {}) => {
  const { isConnected } = useAccount();
  const dispatch = useAppDispatch();

  const selectedToken = useAppSelector(
    (state) => state.transferForm.selectedToken
  );
  const reduxAmount = useAppSelector((state) => state.transferForm.amount);
  const reduxRecipient = useAppSelector(
    (state) => state.transferForm.recipient
  );

  const token = useMemo(() => {
    if (!isConnected) return null;
    return selectedToken ?? initialToken;
  }, [isConnected, selectedToken, initialToken]);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipient: reduxRecipient,
      amount: reduxAmount,
      tokenAddress: selectedToken?.token_address || "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (token) {
      form.setValue("tokenAddress", token.token_address, {
        shouldValidate: false,
      });
    }
  }, [token, form]);

  const handleTokenSelect = useCallback(
    (newToken: Token) => {
      dispatch(setTokenAndResetAmount(newToken));
      form.setValue("amount", "", { shouldValidate: false });
      form.setValue("tokenAddress", newToken.token_address, {
        shouldValidate: true,
      });
    },
    [form, dispatch]
  );

  return {
    form,
    token,
    handleTokenSelect,
    reduxAmount,
    reduxRecipient,
  };
};
