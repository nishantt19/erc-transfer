"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import {
  type UseFormGetValues,
  type UseFormRegisterReturn,
  type UseFormSetValue,
  type Control,
  useWatch,
} from "react-hook-form";
import { ArrowDown2 } from "iconsax-react";

import { computeMaxNativeInput } from "@/utils/utils";
import { type Token } from "@/types";

import { TokenAvatar, TokenSelectModal } from "@/components/main/token";
import { InputWrapper } from "@/components/ui/InputWrapper";
import { type TransferFormValues } from "@/schema/transferSchema";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useGasEstimation } from "@/hooks/useGasEstimation";
import { formatUnits } from "viem";
import { PercentageButtons } from "@/components/main/input/PercentageButtons";

type TokenAmountInputProps = {
  label: string;
  placeholder: string;
  register?: UseFormRegisterReturn;
  error?: string;
  selectedToken?: Token | null;
  onTokenSelect?: (token: Token) => void;
  setValue: UseFormSetValue<TransferFormValues>;
  fieldName: keyof TransferFormValues;
  getValues: UseFormGetValues<TransferFormValues>;
  control: Control<TransferFormValues>;
};

const TokenAmountInput = ({
  label,
  placeholder,
  register,
  error,
  selectedToken,
  onTokenSelect,
  setValue,
  fieldName,
  getValues,
  control,
}: TokenAmountInputProps) => {
  const { isConnected, address } = useAccount();
  const amount = useWatch({ name: fieldName, control });

  const { formattedBalance, isInsufficientBalance, usdValue } = useTokenBalance(
    selectedToken ?? null,
    amount
  );
  const { getRequiredGasAmount } = useGasEstimation();

  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePercentageClick = async (percentage: number) => {
    if (!selectedToken) return;

    const balanceInWei = BigInt(selectedToken.balance);

    const percentageBig = BigInt(Math.floor(percentage));
    const recipient = (getValues("recipient") as `0x${string}`) || address;
    let amountWei = (balanceInWei * percentageBig) / BigInt(100);

    if (percentage === 100) {
      if (selectedToken.native_token) {
        const requiredGasAmountWei = await getRequiredGasAmount(
          selectedToken,
          balanceInWei,
          recipient
        );

        amountWei = computeMaxNativeInput(balanceInWei, requiredGasAmountWei);
      } else {
        amountWei = balanceInWei;
      }
    }

    const formattedAmount = formatUnits(amountWei, selectedToken.decimals);
    setValue(fieldName, formattedAmount, { shouldValidate: true });
  };

  return (
    <>
      <InputWrapper label={label} error={error}>
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="py-2 flex justify-between items-center gap-x-2">
            <input
              type="text"
              placeholder={placeholder}
              className={`w-full flex-1 h-10 bg-transparent outline-none ${
                isInsufficientBalance ? "text-destructive" : "text-foreground"
              } text-2xl placeholder:text-placeholder placeholder:text-4xl`}
              {...register}
            />

            {selectedToken ? (
              <div
                className="rounded-full pl-1 pr-3 flex justify-between items-center gap-x-2 bg-select border border-border-select hover:bg-select-hover h-10 cursor-pointer shrink-0"
                onClick={() => setIsModalOpen(true)}
              >
                <TokenAvatar token={selectedToken} size="sm" />
                <p className="text-white text-base font-medium">
                  {selectedToken.symbol}
                </p>
                <ArrowDown2 color="#ffffffa6" size={20} />
              </div>
            ) : (
              <div
                className={`rounded-full flex items-center font-medium justify-between px-3 h-10 shrink-0 ${
                  isConnected
                    ? "bg-primary shadow-md hover:bg-primary/90 cursor-pointer"
                    : "opacity-60 bg-primary/60 cursor-not-allowed"
                } text-foreground gap-x-1.5`}
                onClick={() => {
                  if (isConnected) {
                    setIsModalOpen(true);
                  }
                }}
              >
                {!isConnected ? "Connect Wallet" : "Select Token"}
                <ArrowDown2 color="#ffffff" size={20} />
              </div>
            )}
          </div>

          <div className="flex flex-row-reverse justify-between items-center text-sm">
            <span
              className={
                isInsufficientBalance ? "text-destructive" : "text-secondary"
              }
            >
              {selectedToken
                ? `${formattedBalance} ${selectedToken.symbol}`
                : "0"}
            </span>
            {selectedToken && !!selectedToken.usd_price && (
              <span className="text-secondary/60">${usdValue}</span>
            )}

            {/* Quick amount selection buttons */}
            <PercentageButtons
              selectedToken={selectedToken ?? null}
              isHovered={isHovered}
              onPercentageClick={handlePercentageClick}
            />
          </div>
        </div>
      </InputWrapper>

      {onTokenSelect && (
        <TokenSelectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedToken={selectedToken}
          onTokenSelect={onTokenSelect}
        />
      )}
    </>
  );
};

export default TokenAmountInput;
