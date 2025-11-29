import { useEffect } from "react";
import { type UseFormReturn } from "react-hook-form";

import { useAppDispatch } from "@/store/hooks";
import { setAmount, setRecipient } from "@/store/slices/transferFormSlice";
import { TIMING_CONSTANTS } from "@/constants";
import { type TransferFormValues } from "@/schema/transferSchema";

interface UseFormSyncProps {
  form: UseFormReturn<TransferFormValues>;
  reduxAmount: string;
  reduxRecipient: string;
}

export const useFormSync = ({
  form,
  reduxAmount,
  reduxRecipient,
}: UseFormSyncProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const currentAmount = form.getValues("amount");
    const currentRecipient = form.getValues("recipient");

    if (reduxAmount !== currentAmount) {
      form.setValue("amount", reduxAmount, { shouldValidate: false });
    }
    if (reduxRecipient !== currentRecipient) {
      form.setValue("recipient", reduxRecipient, { shouldValidate: false });
    }
  }, [reduxAmount, reduxRecipient, form]);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const subscription = form.watch((value, { name }) => {
      if (name === "amount" || name === "recipient") {
        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
          if (name === "amount" && value.amount !== reduxAmount) {
            dispatch(setAmount(value.amount || ""));
          }
          if (name === "recipient" && value.recipient !== reduxRecipient) {
            dispatch(setRecipient(value.recipient || ""));
          }
        }, TIMING_CONSTANTS.FORM_SYNC_DEBOUNCE);
      }
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      subscription.unsubscribe();
    };
  }, [form, dispatch, reduxAmount, reduxRecipient]);
};
