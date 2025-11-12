"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { UseFormRegisterReturn } from "react-hook-form";
import { ArrowDown2 } from "iconsax-react";

import { formatBalance } from "@/utils/utils";
import { type Token } from "@/types";

import { TokenAvatar, TokenSelectModal } from "@/components/main/token";

type InputProps = {
  placeholder: string;
  label: string;
  showBalance?: boolean;
  showSelectToken?: boolean;
  register?: UseFormRegisterReturn;
  error?: string;
  selectedToken?: Token | null;
  onTokenSelect?: (token: Token) => void;
  value?: string;
};

const Input = ({
  label,
  placeholder,
  showBalance,
  showSelectToken,
  register,
  error,
  selectedToken,
  onTokenSelect,
  value,
}: InputProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useAccount();

  return (
    <>
      <div className="bg-input border border-transparent hover:bg-input-hover focus-within:bg-card focus-within:border-border-input focus-within:hover:bg-card focus-within:hover:border-border-input transition-colors p-4 rounded-2xl flex flex-col">
        <div className="text-sm text-secondary uppercase">{label}</div>
        <div className="py-2 flex justify-between items-center">
          <input
            type="text"
            placeholder={placeholder}
            className="w-full flex-1 bg-transparent outline-none text-foreground placeholder:text-placeholder text-4xl"
            {...register}
            value={value}
          />
          {showSelectToken ? (
            selectedToken ? (
              <div
                className="rounded-full pl-1 pr-3 flex justify-between items-center gap-x-2 bg-select border border-border-select hover:bg-select-hover h-10 cursor-pointer"
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
                className={`rounded-full flex items-center font-medium justify-between px-3 h-10 ${
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
            )
          ) : null}
        </div>
        <div
          className={`text-sm flex justify-end items-center text-secondary ${
            showBalance ? "visible" : "invisible"
          }`}
        >
          <span>
            {selectedToken
              ? `${formatBalance(
                  selectedToken.balance,
                  selectedToken.decimals
                )} ${selectedToken.symbol}`
              : "0"}
          </span>
        </div>
        {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      </div>
      {showSelectToken && onTokenSelect && (
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

export default Input;
