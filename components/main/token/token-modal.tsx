"use client";
import { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Coin1 } from "iconsax-react";

import { MORALIS_CHAIN_MAP } from "@/utils/constants";
import { type Token } from "@/types";
import { truncateAddress } from "@/utils/utils";

import ShimmerAnimation from "@/components/ui/ShimmerAnimation";
import { TokenAvatar } from "@/components/main/token";
import Modal from "@/components/ui/Modal";

async function fetchWalletTokens(address: string, chain: string) {
  const res = await axios.get("/api/tokens", {
    params: { address, chain },
  });
  return res.data;
}

type TokenSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedToken?: Token | null;
  onTokenSelect: (token: Token) => void;
};

export default function TokenSelectModal({
  isOpen,
  onClose,
  selectedToken,
  onTokenSelect,
}: TokenSelectModalProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const chain = useMemo(() => MORALIS_CHAIN_MAP[chainId], [chainId]);

  const { data, isLoading } = useQuery({
    queryKey: ["walletTokens", address, chain],
    queryFn: () => fetchWalletTokens(address!, chain!),
    enabled: !!address && !!chain && isConnected && isOpen,
  });

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Token">
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {!isConnected ? (
          <div className="text-secondary text-center py-8">
            Connect your wallet to view tokens
          </div>
        ) : isLoading ? (
          <>
            <ShimmerAnimation />
            <ShimmerAnimation />
          </>
        ) : !data?.result?.length ? (
          <div className="text-secondary text-center py-8">No tokens found</div>
        ) : (
          <>
            <div className="flex items-center gap-x-2 mb-4">
              <Coin1 size={18} color="#ffffffa6" />
              <p className="text-secondary font-medium">Your Tokens</p>
            </div>
            {data.result.map((token: Token) => {
              const isSelected =
                selectedToken?.token_address === token.token_address;
              return (
                <div
                  key={token.token_address}
                  className={`flex items-center gap-3 p-2 rounded-xl transition cursor-pointer ${
                    isSelected
                      ? "bg-card border border-border-input"
                      : "bg-transparent hover:bg-input-hover border border-transparent"
                  }`}
                  onClick={() => handleTokenSelect(token)}
                >
                  <TokenAvatar token={token} size="md" />
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">
                      {token.symbol}
                    </div>
                    <div className="flex justify-start items-end gap-x-2">
                      <span className="text-secondary text-sm">
                        {token.name}
                      </span>
                      <span className="text-placeholder text-sm">
                        {truncateAddress(token.token_address)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </Modal>
  );
}
