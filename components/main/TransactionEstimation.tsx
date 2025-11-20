"use client";
import { useState, useEffect } from "react";
import { formatGwei } from "viem";

import {
  getNetworkCongestionLevel,
  getCongestionColor,
  getCongestionLabel,
} from "@/utils/networkCongestion";
import type { TransactionEstimate } from "@/types";
import { formatSeconds } from "@/utils/utils";
import { GAS_TIER_LABELS } from "@/utils/gasCalculations";

interface TransactionEstimationProps {
  estimate: TransactionEstimate | null;
  startTime: number;
  blockNumber?: bigint;
  status: "pending" | "included";
  networkCongestion?: number;
}

const UPDATE_INTERVAL = 1000;

export const TransactionEstimation = ({
  estimate,
  startTime,
  blockNumber,
  status,
  networkCongestion = 0.5,
}: TransactionEstimationProps) => {
  const [elapsedTime, setElapsedTime] = useState(() =>
    Math.floor((Date.now() - startTime) / 1000)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [startTime]);
  const congestionLevel = getNetworkCongestionLevel(networkCongestion);
  const congestionColor = getCongestionColor(congestionLevel);
  const congestionLabel = getCongestionLabel(congestionLevel);

  const statusText =
    status === "pending" ? "Pending in mempool" : "Waiting for confirmations";

  const statusStyles =
    status === "pending"
      ? {
          border: "border-warning/50",
          textColor: "text-warning",
          dotBg: "bg-warning",
        }
      : {
          border: "border-accent-blue/50",
          textColor: "text-accent-blue",
          dotBg: "bg-accent-blue",
        };

  const tierLabel = estimate
    ? GAS_TIER_LABELS[estimate.tier] || estimate.tier
    : "Unknown";
  const formattedGasCost = estimate
    ? parseFloat(formatGwei(estimate.estimatedGasCost)).toFixed(2)
    : "0.00";

  return (
    <div
      className={`w-full rounded-2xl p-4 mt-2 flex flex-col gap-y-3 text-sm border-2 ${statusStyles.border} bg-card/50 transition-all duration-300`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${statusStyles.dotBg} animate-pulse shadow-lg`}
          />
          <span className={`font-semibold text-base ${statusStyles.textColor}`}>
            {statusText}
          </span>
        </div>
        <span className="font-medium font-mono text-foreground">
          {formatSeconds(elapsedTime)}
        </span>
      </div>
      <div className="flex flex-col gap-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">
            Network Congestion:
          </span>
          <span className={`font-semibold ${congestionColor}`}>
            {congestionLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Priority:</span>
          <span className="font-semibold text-foreground">{tierLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">
            Estimated Gas:
          </span>
          <span className="font-semibold text-foreground">
            {formattedGasCost} Gwei
          </span>
        </div>
        {estimate && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">
              Estimated Time:
            </span>
            <span className="font-semibold text-foreground">
              ~{formatSeconds(estimate.estimatedWaitTime / 1000)}
            </span>
          </div>
        )}
        {blockNumber && (
          <div className="flex items-center justify-between pt-2.5 mt-0.5 border-t border-border">
            <span className="text-muted-foreground font-medium">
              Block Number:
            </span>
            <span
              className={`font-semibold font-mono ${statusStyles.textColor}`}
            >
              {blockNumber.toString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
