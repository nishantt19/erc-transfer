"use client";
import { motion, AnimatePresence } from "framer-motion";

import { type Token } from "@/types";
import { Tooltip } from "@/components/ui/Tooltip";
import { PERCENTAGE_OPTIONS } from "@/utils/constants";

type PercentageButtonsProps = {
  selectedToken: Token | null;
  isHovered: boolean;
  onPercentageClick: (percentage: number) => void;
};

export const PercentageButtons = ({
  selectedToken,
  isHovered,
  onPercentageClick,
}: PercentageButtonsProps) => {
  if (!selectedToken) return null;

  return (
    <div className="flex gap-x-1.5 absolute right-0 -top-6">
      <AnimatePresence>
        {isHovered &&
          PERCENTAGE_OPTIONS.map((percentage, index) => {
            const isMaxButton = percentage === 100;
            const shouldShowTooltip = isMaxButton && selectedToken.native_token;

            const buttonContent = (
              <motion.button
                key={percentage}
                type="button"
                onClick={() => onPercentageClick(percentage)}
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
                {isMaxButton ? "MAX" : `${percentage}%`}
              </motion.button>
            );

            return shouldShowTooltip ? (
              <Tooltip
                key={percentage}
                content="A small portion of your balance is reserved for transaction gas fees"
                position="top"
              >
                {buttonContent}
              </Tooltip>
            ) : (
              buttonContent
            );
          })}
      </AnimatePresence>
    </div>
  );
};
