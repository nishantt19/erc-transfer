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
import { motion, AnimatePresence } from "framer-motion";

import { calculateUsdValue, formatBalance } from "@/utils/utils";
import { type Token } from "@/types";

import { TokenAvatar, TokenSelectModal } from "@/components/main/token";
import { InputWrapper } from "@/components/ui/InputWrapper";
import { type TransferFormValues } from "@/schema/transferSchema";

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
  const { isConnected } = useAccount();
  const amount = useWatch({ name: fieldName, control });

  const currentAmount = amount ? parseFloat(amount) : 0;

  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePercentageClick = (percentage: number) => {
    if (!selectedToken) return;

    const balance =
      Number(selectedToken.balance) / 10 ** selectedToken.decimals;
    const amount = (balance * percentage) / 100;

    const formattedAmount = amount.toFixed(selectedToken.decimals);
    const cleanAmount = parseFloat(formattedAmount).toString();

    setValue(fieldName, cleanAmount, { shouldValidate: true });
  };

  const tokenBalance = selectedToken
    ? parseFloat(formatBalance(selectedToken.balance, selectedToken.decimals))
    : 0;

  const isInsufficientBalance = currentAmount > tokenBalance;

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
              {selectedToken ? `${tokenBalance} ${selectedToken.symbol}` : "0"}
            </span>
            {selectedToken && !!selectedToken.usd_price && (
              <span className="text-secondary/60">
                ${calculateUsdValue(getValues(fieldName), selectedToken)}
              </span>
            )}

            {/* Quick amount selection buttons */}
            {selectedToken && (
              <div className="flex gap-x-1.5 absolute right-0 -top-6">
                <AnimatePresence>
                  {isHovered &&
                    [25, 50, 75, 100].map((percentage, index) => (
                      <motion.button
                        key={percentage}
                        type="button"
                        onClick={() => handlePercentageClick(percentage)}
                        className="text-xs px-1.5 py-1 rounded-xl bg-select cursor-pointer hover:bg-select-hover text-secondary hover:text-foreground transition-colors border border-border-select"
                        initial={{ opacity: 0, scale: 0, y: -10 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: 0,
                          transition: {
                            delay: index * 0.05,
                            duration: 0.3,
                            type: "spring",
                            bounce: 0.5,
                            stiffness: 300,
                            damping: 15,
                          },
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0,
                          y: -10,
                          transition: {
                            duration: 0.2,
                          },
                        }}
                      >
                        {percentage === 100 ? "MAX" : `${percentage}%`}
                      </motion.button>
                    ))}
                </AnimatePresence>
              </div>
            )}
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
