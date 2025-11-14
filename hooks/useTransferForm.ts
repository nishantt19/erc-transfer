import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useForm } from "react-hook-form";

import { type Token } from "@/types";
import {
  type TransferFormValues,
  transferSchema,
} from "@/schema/transferSchema";
import { zodResolver } from "@hookform/resolvers/zod";

export const useTransferForm = () => {
  const { isConnected } = useAccount();
  const [token, setToken] = useState<Token | null>(null);

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
    if (!isConnected) {
      form.reset();
    }
  }, [isConnected, form]);

  const handleTokenSelect = (token: Token) => {
    setToken(token);
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
