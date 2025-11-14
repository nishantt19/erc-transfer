"use client";
import { useAccount } from "wagmi";

import { TransferFormValues } from "@/schema/transferSchema";

import { TokenAmountInput, AddressInput } from "@/components/main/input";
import { useTransferForm } from "@/hooks/useTransferForm";

const TransferCard = () => {
  const { isConnected } = useAccount();
  const {
    token,
    handleTokenSelect,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
    getValues,
    control,
  } = useTransferForm();

  const selectedToken = isConnected ? token : null;

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
        <TokenAmountInput
          label="Amount"
          placeholder="0"
          register={register("amount")}
          error={errors.amount?.message}
          selectedToken={selectedToken}
          onTokenSelect={handleTokenSelect}
          setValue={setValue}
          fieldName="amount"
          getValues={getValues}
          control={control}
        />
        <AddressInput
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
