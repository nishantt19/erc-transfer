import { type Token } from "@/types";
import { useFormValidation } from "./useFormValidation";
import { useFormState } from "./useFormState";
import { useFormSync } from "./useFormSync";

interface UseTransferFormProps {
  initialToken?: Token | null;
}

export const useTransferForm = ({
  initialToken = null,
}: UseTransferFormProps = {}) => {
  useFormValidation();

  const { form, token, handleTokenSelect, reduxAmount, reduxRecipient } =
    useFormState({ initialToken });

  useFormSync({ form, reduxAmount, reduxRecipient });

  return {
    ...form,
    token,
    handleTokenSelect,
  };
};
