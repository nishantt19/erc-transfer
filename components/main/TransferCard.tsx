"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { TransferFormValues, transferSchema } from "@/schema/transferSchema";
import { type Token } from "@/types";

import Input from "@/components/ui/Input";

const TransferCard = () => {
  const { isConnected } = useAccount();
  const [token, setToken] = useState<Token | null>(null);

  const {
    handleSubmit,
    register,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipient: "",
      amount: "",
      tokenAddress: "",
    },
    mode: "all",
  });

  const selectedToken = isConnected ? token : null;

  useEffect(() => {
    if (!isConnected) {
      reset();
    }
  }, [isConnected, reset]);

  const handleTokenSelect = (token: Token) => {
    setToken(token);
    setValue("tokenAddress", token.token_address, { shouldValidate: true });
  };

  const onSubmit = (data: TransferFormValues) => {
    console.log("Form submitted:", data);
    console.log("Selected token details:", selectedToken);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full bg-card rounded-3xl p-2.5 flex flex-col gap-y-2.5"
    >
      <div className="flex flex-col gap-y-2">
        <Input
          showBalance
          label="Amount"
          placeholder="0"
          showSelectToken={true}
          register={register("amount")}
          error={errors.amount?.message}
          selectedToken={selectedToken}
          onTokenSelect={handleTokenSelect}
        />
        <Input
          label="Recipient Address"
          placeholder="0x..."
          register={register("recipient")}
          error={errors.recipient?.message}
        />
      </div>
      <button
        disabled={!isConnected}
        className="py-4 px-5 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:bg-primary/60 disabled:cursor-not-allowed text-foreground text-lg font-semibold cursor-pointer"
      >
        {!isConnected ? "Connect Wallet to Continue" : "Send Tokens"}
      </button>
    </form>
  );
};

export default TransferCard;
