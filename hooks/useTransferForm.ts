import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useForm } from "react-hook-form";

import { type Token } from "@/types";
import {
  type TransferFormValues,
  transferSchema,
} from "@/schema/transferSchema";
import { zodResolver } from "@hookform/resolvers/zod";

interface UseTransferFormProps {
  initialToken?: Token | null;
}

export const useTransferForm = ({
  initialToken = null,
}: UseTransferFormProps = {}) => {
  const { isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const token = isConnected ? (selectedToken ?? initialToken) : null;

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipient: "",
      amount: "",
      tokenAddress: "",
    },
    mode: "all",
  });

  useEffect(() => {
    if (token) {
      form.setValue("tokenAddress", token.token_address, {
        shouldValidate: false,
      });
    }
  }, [token, form]);

  useEffect(() => {
    if (!isConnected) {
      form.reset();
    }
  }, [isConnected, form]);

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    form.setValue("tokenAddress", token.token_address, {
      shouldValidate: true,
    });
  };

  return {
    ...form,
    token,
    handleTokenSelect,
  };
};
