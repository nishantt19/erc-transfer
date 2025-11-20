"use client";
import { useState } from "react";
import { IoCheckmark, IoCopy, IoOpenOutline } from "react-icons/io5";

import { getTransactionUrl } from "@/utils/blockExplorer";
import { CHAIN_ID } from "@/types";
import { formatSeconds, truncateHash } from "@/utils/utils";
import { COPY_RESET_DELAY } from "@/utils/constants";
import { Tooltip } from "../ui/Tooltip";

interface TransactionSuccessProps {
  hash: `0x${string}`;
  amount: string;
  tokenSymbol: string;
  completionTimeSeconds: number;
  isNativeToken: boolean;
  chainId: CHAIN_ID;
}

export const TransactionSuccess = ({
  hash,
  amount,
  tokenSymbol,
  completionTimeSeconds,
  isNativeToken,
  chainId,
}: TransactionSuccessProps) => {
  const [copied, setCopied] = useState(false);

  const explorerUrl = getTransactionUrl(chainId, hash);
  const transactionType = isNativeToken
    ? "Native asset transfer"
    : "ERC-20 token transfer";
  const formattedHash = truncateHash(hash);
  const formattedTime = formatSeconds(completionTimeSeconds);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_RESET_DELAY);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="w-full rounded-2xl p-4 mt-2 flex flex-col gap-y-3 text-sm border-2 border-success/50 bg-card/50 transition-all duration-300">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-success shadow-lg" />
          <span className="font-semibold text-base text-success">
            Transaction Confirmed
          </span>
        </div>
        <IoCheckmark className="w-5 h-5 text-success" />
      </div>
      <div className="flex flex-col gap-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Amount:</span>
          <span className="font-semibold text-foreground">
            {amount} {tokenSymbol}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">
            Completion Time:
          </span>
          <span className="font-semibold font-mono text-foreground">
            {formattedTime}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">
            Transaction Type:
          </span>
          <span className="font-semibold text-foreground">
            {transactionType}
          </span>
        </div>
        <div className="flex flex-col gap-y-1.5 pt-2.5 mt-0.5 border-t border-border">
          <span className="text-muted-foreground font-medium text-xs">
            Transaction Hash
          </span>
          <div className="flex items-center justify-between gap-2 bg-input border-border-input rounded-lg p-2.5 border border-border/50">
            <span className="font-mono text-xs text-foreground">
              {formattedHash}
            </span>
            <Tooltip content="Copy to Clipboard" className="text-nowrap">
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-input-hover rounded-md transition-colors cursor-pointer"
              >
                {copied ? (
                  <IoCheckmark className="w-4 h-4 text-success" />
                ) : (
                  <IoCopy className="w-4 h-4 text-foreground" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary/90 rounded-xl transition-colors font-semibold text-foreground"
        >
          <span>View on Block Explorer</span>
          <IoOpenOutline className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
