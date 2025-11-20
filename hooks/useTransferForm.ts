import { useEffect, useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { type Token } from "@/types";
import {
  type TransferFormValues,
  transferSchema,
} from "@/schema/transferSchema";

interface UseTransferFormProps {
  initialToken?: Token | null;
}

export const useTransferForm = ({
  initialToken = null,
}: UseTransferFormProps = {}) => {
  const { isConnected, chainId } = useAccount();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const token = useMemo(() => {
    if (!isConnected) return null;
    return selectedToken ?? initialToken;
  }, [isConnected, selectedToken, initialToken]);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedToken(null);
  }, [chainId]);

  useEffect(() => {
    if (token) {
      form.setValue("tokenAddress", token.token_address, {
        shouldValidate: false,
      });
    }
  }, [token, form]);

  const handleTokenSelect = useCallback(
    (newToken: Token) => {
      setSelectedToken(newToken);
      form.setValue("tokenAddress", newToken.token_address, {
        shouldValidate: true,
      });
    },
    [form]
  );

  return {
    ...form,
    token,
    handleTokenSelect,
  };
};
