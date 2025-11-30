import { useEffect, useRef } from "react";
import { type UseFormReturn } from "react-hook-form";

import { useAppDispatch } from "@/store/hooks";
import { setAmount, setRecipient } from "@/store/slices/transferFormSlice";
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
  // Prevent circular updates between form and Redux
  const isSyncingFromRedux = useRef(false);
  const isSyncingFromForm = useRef(false);

  // Track latest redux values to compare in watch callback
  const reduxAmountRef = useRef(reduxAmount);
  const reduxRecipientRef = useRef(reduxRecipient);

  useEffect(() => {
    reduxAmountRef.current = reduxAmount;
    reduxRecipientRef.current = reduxRecipient;
  }, [reduxAmount, reduxRecipient]);

  useEffect(() => {
    if (isSyncingFromForm.current) return;

    const currentAmount = form.getValues("amount");
    const currentRecipient = form.getValues("recipient");

    isSyncingFromRedux.current = true;
    if (reduxAmount !== currentAmount) {
      form.setValue("amount", reduxAmount, { shouldValidate: false });
    }
    if (reduxRecipient !== currentRecipient) {
      form.setValue("recipient", reduxRecipient, { shouldValidate: false });
    }
    isSyncingFromRedux.current = false;
  }, [reduxAmount, reduxRecipient, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (isSyncingFromRedux.current) return;

      // Only sync targeted fields
      if (name === "amount" || name === "recipient") {
        isSyncingFromForm.current = true;
        if (name === "amount" && value.amount !== reduxAmountRef.current) {
          dispatch(setAmount(value.amount || ""));
        }
        if (
          name === "recipient" &&
          value.recipient !== reduxRecipientRef.current
        ) {
          dispatch(setRecipient(value.recipient || ""));
        }
        isSyncingFromForm.current = false;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form, dispatch]);
};
