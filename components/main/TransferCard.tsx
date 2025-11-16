"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import {
  sendTransaction,
  writeContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { erc20Abi, parseUnits } from "viem";
import { toast } from "sonner";

import { TransferFormValues } from "@/schema/transferSchema";

import { TokenAmountInput, AddressInput } from "@/components/main/input";
import { useTransferForm } from "@/hooks/useTransferForm";
import { useWalletTokens } from "@/hooks/useWalletTokens";
import { config } from "@/config/wagmi";

const TransferCard = () => {
  const { isConnected } = useAccount();
  const { nativeToken } = useWalletTokens();
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "signing" | "pending">(
    "idle"
  );
  const {
    token,
    handleTokenSelect,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
    getValues,
    control,
    reset,
  } = useTransferForm({ initialToken: nativeToken });

  const selectedToken = isConnected ? token : null;

  const onSubmit = async (data: TransferFormValues) => {
    if (!selectedToken) {
      toast.error("No token selected");
      return;
    }

    setIsProcessing(true);
    setTxStatus("signing");

    try {
      const amountInWei = parseUnits(data.amount, selectedToken.decimals);

      let hash: `0x${string}`;

      if (selectedToken.native_token) {
        toast.loading("Initiating Native Token transfer...");

        hash = await sendTransaction(config, {
          to: data.recipient as `0x${string}`,
          value: amountInWei,
        });
      } else {
        toast.loading("Initiating ERC20 Token transfer...");

        hash = await writeContract(config, {
          address: selectedToken.token_address,
          abi: erc20Abi,
          functionName: "transfer",
          args: [data.recipient as `0x${string}`, amountInWei],
        });
      }

      toast.dismiss();
      setTxStatus("pending");

      toast.loading("Transaction pending...", {
        description: `Hash: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
      });

      const receipt = await waitForTransactionReceipt(config, {
        hash,
      });

      toast.dismiss();

      if (receipt.status === "success") {
        toast.success("Transfer successful!", {
          description: `Sent ${data.amount} ${
            selectedToken.symbol
          } to ${data.recipient.slice(0, 6)}...${data.recipient.slice(-4)}`,
        });
        reset();
      } else {
        toast.error("Transaction failed", {
          description: "The transaction was reverted",
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.dismiss();

      if (error?.message?.includes("User rejected")) {
        toast.error("Transaction rejected", {
          description: "You rejected the transaction in your wallet",
        });
      } else if (error?.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds", {
          description: selectedToken.native_token
            ? "You don't have enough balance to cover the transfer and gas fees"
            : "You don't have enough balance for this transfer or gas fees",
        });
      } else if (error?.message?.includes("gas")) {
        toast.error("Gas estimation failed", {
          description: "Unable to estimate gas for this transaction",
        });
      } else {
        toast.error("Transfer failed", {
          description: error?.message || "An unknown error occurred",
        });
      }

      console.error("Transfer error:", error);
    } finally {
      setIsProcessing(false);
      setTxStatus("idle");
    }
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
        disabled={!isConnected || isProcessing}
        className="py-4 px-5 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:bg-primary/60 disabled:cursor-not-allowed text-foreground text-lg font-semibold cursor-pointer"
      >
        {!isConnected
          ? "Connect Wallet to Continue"
          : isProcessing
          ? txStatus === "signing"
            ? "Confirm in Wallet..."
            : "Transaction Pending..."
          : "Send Tokens"}
      </button>
    </form>
  );
};

export default TransferCard;
